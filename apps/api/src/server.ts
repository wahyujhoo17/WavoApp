import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import IORedis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import { env } from './config/env.js';
import { whatsAppServiceManager } from './services/whatsapp.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { serviceRoutes } from './routes/services.js';
import { messagingRoutes } from './routes/messaging.js';
import { logsRoutes } from './routes/logs.js';
import { prisma } from 'database';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    validateApiKey: (request: any, reply: any) => Promise<void>;
  }
}

export interface FastifyInstanceWithIO extends FastifyInstance {
  io: SocketServer;
}

export async function createServer(): Promise<FastifyInstanceWithIO> {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Security Headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
  });

  // Setup Rate Limiting with Redis
  const redisClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  await fastify.register(rateLimit, {
    global: true,
    max: 300, // 300 requests per minute per IP globally
    timeWindow: '1 minute',
    redis: redisClient,
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: `Too many requests. Please try again in ${context.after}.`
      }
    })
  });

  fastify.addHook('onClose', async () => {
    await redisClient.quit();
  });

  // Setup multipart (for image uploads)
  await fastify.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 16 * 1024 * 1024, // 16MB per PRD Section 10.3
      files: 1,
      headerPairs: 2000
    }
  });

  // Setup JWT validation
  // Fallback key in dev to prevent crashes
  const secretKey = env.JWT_PRIVATE_KEY || 'wavo_secret_dev_fallback_key';
  await fastify.register(jwt, {
    secret: secretKey,
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    },
  });

  // Authentication Decorator
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub }
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'USER_SUSPENDED',
            message: 'Your account has been suspended. Please contact support.',
          },
          meta: {
            requestId: request.id,
            timestamp: new Date(),
          }
        });
      }
      request.dbUser = user;
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authentication token',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date(),
        }
      });
    }
  });

  // Request decorator for API Key validation
  fastify.decorate('validateApiKey', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing Bearer token in Authorization header',
        }
      });
    }

    const apiKeyRaw = authHeader.split(' ')[1];
    if (!apiKeyRaw || !apiKeyRaw.startsWith('wavo_sk_')) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API Key format',
        }
      });
    }

    // Hash incoming api key to verify
    const crypto = await import('crypto');
    const hashedKey = crypto.createHash('sha256').update(apiKeyRaw).digest('hex');

    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash: hashedKey, isActive: true },
      include: { user: true, service: true }
    });

    if (!keyRecord || !keyRecord.user.isActive) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'USER_SUSPENDED',
          message: 'Account associated with this API Key has been suspended.',
        }
      });
    }

    // Attach user and service metadata to request
    request.user = keyRecord.user;
    request.service = keyRecord.service;
  });

  // Global Error Handler matching PRD specs
  fastify.setErrorHandler((error: any, request, reply) => {
    fastify.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed for request parameters',
          details: error.validation,
        },
        meta: { requestId: request.id, timestamp: new Date() }
      });
    }

    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected server error occurred',
      },
      meta: { requestId: request.id, timestamp: new Date() }
    });
  });

  // Liveness Check
  fastify.get('/healthz', async () => ({ status: 'ok', uptime: process.uptime() }));

  // Readiness Check
  fastify.get('/readyz', async (request, reply) => {
    try {
      const { prisma } = await import('database');
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      reply.status(503).send({ status: 'unready', reason: 'Database connection failed' });
    }
  });

  // Register API Routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
  await fastify.register(serviceRoutes, { prefix: '/api/v1/services' });
  await fastify.register(messagingRoutes, { prefix: '/api/v1/send' });
  await fastify.register(logsRoutes, { prefix: '/api/v1' });

  // Initialize Socket.IO
  const io = new SocketServer(fastify.server as http.Server, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Set manager instance to use this Socket.IO server
  whatsAppServiceManager.setSocketIO(io);

  // Socket.IO Authentication Middleware
  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!auth) {
        return next(new Error('Authentication error: Missing token'));
      }
      
      const decoded = fastify.jwt.verify(auth);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    fastify.log.info(`Socket connected: ${socket.id} (User: ${socket.data.user?.sub})`);

    socket.on('subscribe', async ({ serviceId }) => {
      if (serviceId && socket.data.user?.sub) {
        try {
          const service = await prisma.whatsAppService.findUnique({
            where: { id: serviceId }
          });
          
          if (service && service.userId === socket.data.user.sub) {
            socket.join(`service:${serviceId}`);
            fastify.log.info(`Socket ${socket.id} subscribed to service:${serviceId}`);
          } else {
            fastify.log.warn(`Socket ${socket.id} unauthorized attempt to subscribe to service:${serviceId}`);
          }
        } catch (e) {
          fastify.log.error(e);
        }
      }
    });

    socket.on('subscribe:admin', async () => {
      if (socket.data.user?.sub) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: socket.data.user.sub }
          });
          
          if (user && user.role === 'SUPER_ADMIN') {
            socket.join('admin');
            fastify.log.info(`Socket ${socket.id} subscribed to admin room`);
          } else {
            fastify.log.warn(`Socket ${socket.id} unauthorized attempt to subscribe to admin room`);
          }
        } catch (e) {
          fastify.log.error(e);
        }
      }
    });

    socket.on('disconnect', () => {
      fastify.log.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Cast fastify instance to export with IO support
  const fastifyWithIO = fastify as unknown as FastifyInstanceWithIO;
  fastifyWithIO.io = io;

  return fastifyWithIO;
}
export default createServer;
