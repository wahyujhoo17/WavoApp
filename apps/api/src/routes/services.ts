import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma, ServiceStatus, UserPlan } from 'database';
import { whatsAppServiceManager } from '../services/whatsapp.js';
import crypto from 'crypto';

const createServiceSchema = z.object({
  name: z.string().min(2),
  webhookUrl: z.string().url().optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(2),
});

export const serviceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Apply JWT authentication globally to all service routes
  fastify.addHook('preHandler', fastify.authenticate as any);

  // GET /api/v1/services - List own WhatsApp instances
  fastify.get('/', async (request: any, reply) => {
    const userId = request.user.sub;

    const services = await prisma.whatsAppService.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    return reply.status(200).send({
      success: true,
      data: services.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        phoneNumber: s.phoneNumber,
        createdAt: s.createdAt
      }))
    });
  });

  // GET /api/v1/services/:id - Get details of a single WhatsApp instance
  fastify.get('/:id', async (request: any, reply) => {
    const serviceId = request.params.id;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
      include: {
        webhooks: true,
        apiKeys: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'WhatsApp Service not found' }
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        status: service.status,
        phoneNumber: service.phoneNumber,
        createdAt: service.createdAt,
        webhooks: service.webhooks.map(wh => ({
          id: wh.id,
          url: wh.url,
          secret: wh.secret,
          events: wh.events,
          isActive: wh.isActive
        })),
        apiKeys: service.apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          isActive: key.isActive,
          createdAt: key.createdAt
        }))
      }
    });
  });


  // POST /api/v1/services - Create a new instance
  fastify.post('/', async (request: any, reply) => {
    const parse = createServiceSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid service parameters',
          details: parse.error.format()
        }
      });
    }

    const { name, webhookUrl } = parse.data;
    const userId = request.user.sub;
    const plan = request.user.plan as UserPlan;

    // Plan instance limit check (Section 7)
    const activeInstancesCount = await prisma.whatsAppService.count({
      where: { userId, deletedAt: null }
    });

    let allowedInstances = 1; // FREE
    if (plan === 'PRO') allowedInstances = 5;
    else if (plan === 'BUSINESS') allowedInstances = 20;
    else if (plan === 'ENTERPRISE') allowedInstances = 999999; // Unlimited

    if (activeInstancesCount >= allowedInstances) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: `Your ${plan} plan allows a maximum of ${allowedInstances} WhatsApp services`
        }
      });
    }

    // Auto-generate slug: slugify(name) + short unique hash
    const hash = crypto.randomBytes(2).toString('hex');
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${hash}`;

    // Create WhatsApp service
    const service = await prisma.whatsAppService.create({
      data: {
        userId,
        name,
        slug,
        status: ServiceStatus.INACTIVE,
      }
    });

    // Create webhook config if provided
    if (webhookUrl) {
      const secret = `wavo_wh_${crypto.randomBytes(16).toString('hex')}`;
      await prisma.webhookConfig.create({
        data: {
          serviceId: service.id,
          url: webhookUrl,
          secret,
          events: ['message.received', 'message.sent', 'message.failed', 'instance.connected', 'instance.disconnected'],
          isActive: true
        }
      });
    }

    return reply.status(201).send({
      success: true,
      data: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        status: service.status
      }
    });
  });

  // POST /api/v1/services/:id/connect - Trigger connect (initiates Baileys QR generation)
  fastify.post('/:id/connect', async (request: any, reply) => {
    const serviceId = request.params.id;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null }
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'WhatsApp Service not found' }
      });
    }

    // If already active, return current QR or status
    const sock = whatsAppServiceManager.getActiveSocket(serviceId);
    if (sock && service.status === ServiceStatus.CONNECTED) {
      return reply.status(200).send({
        success: true,
        data: { message: 'WhatsApp Service is already connected', status: service.status }
      });
    }

    // Trigger in background
    whatsAppServiceManager.initInstance(serviceId, service.slug).catch(err => {
      fastify.log.error(`Failed to initialize session ${serviceId}:`, err);
    });

    // Wait a brief moment to catch initial QR code generation
    let attempts = 0;
    while (attempts < 10) {
      const qr = whatsAppServiceManager.getQR(serviceId);
      if (qr) {
        return reply.status(200).send({
          success: true,
          data: { qr, expiresIn: 60 }
        });
      }
      const activeSock = whatsAppServiceManager.getActiveSocket(serviceId);
      if (activeSock && activeSock.user) {
        return reply.status(200).send({
          success: true,
          data: { status: ServiceStatus.CONNECTED }
        });
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      attempts++;
    }

    // Fallback if QR takes longer to generate
    return reply.status(202).send({
      success: true,
      data: { message: 'Connection initiated. Listening for QR code on WebSocket room: service:' + serviceId }
    });
  });

  // POST /api/v1/services/:id/disconnect - Disconnect instance session
  fastify.post('/:id/disconnect', async (request: any, reply) => {
    const serviceId = request.params.id;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null }
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'WhatsApp Service not found' }
      });
    }

    await whatsAppServiceManager.disconnectInstance(serviceId);

    return reply.status(200).send({
      success: true,
      data: { message: 'Service disconnected successfully' }
    });
  });

  // DELETE /api/v1/services/:id - Delete instance completely
  fastify.delete('/:id', async (request: any, reply) => {
    const serviceId = request.params.id;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null }
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'WhatsApp Service not found' }
      });
    }

    // Force disconnect and remove credentials folder
    await whatsAppServiceManager.deleteInstance(serviceId);

    // Soft delete from database (Section 11)
    await prisma.whatsAppService.update({
      where: { id: serviceId },
      data: { 
        status: ServiceStatus.INACTIVE, 
        deletedAt: new Date() 
      }
    });

    return reply.status(200).send({
      success: true,
      data: { message: 'Service successfully deleted' }
    });
  });
};
