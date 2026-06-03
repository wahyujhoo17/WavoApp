import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma, UserRole, UserPlan, ServiceStatus } from 'database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { whatsAppServiceManager } from '../services/whatsapp.js';

// Hook to verify administrative access
const requireAdmin = async (request: any, reply: FastifyReply) => {
  const user = request.user;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Administrative access required.',
      },
    });
  }
};

export async function adminRoutes(fastify: FastifyInstance) {
  // Pre-handler hook to authenticate all routes in this plugin
  fastify.addHook('preHandler', fastify.authenticate as any);
  fastify.addHook('preHandler', requireAdmin as any);

  // 1. GET /api/v1/admin/users - List all users with service counts
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          plan: true,
          isActive: true,
          createdAt: true,
          services: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.status(200).send({
        success: true,
        data: users,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve users list.',
        },
      });
    }
  });

  // 2. PUT /api/v1/admin/users/:id/status - Toggle isActive status (Suspend/Reactivate)
  fastify.put('/users/:id/status', async (request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { isActive } = request.body;

    if (typeof isActive !== 'boolean') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isActive status must be a boolean.',
        },
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id, deletedAt: null },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found.',
          },
        });
      }

      // Prevent self-suspension
      if (user.id === (request.user as any).sub) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'You cannot suspend your own administrative account.',
          },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      return reply.status(200).send({
        success: true,
        data: updatedUser,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user status.',
        },
      });
    }
  });

  // 3. PUT /api/v1/admin/users/:id/plan - Upgrade or modify user's subscription tier
  fastify.put('/users/:id/plan', async (request: FastifyRequest<{ Params: { id: string }; Body: { plan: UserPlan } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { plan } = request.body;

    const validPlans = Object.values(UserPlan);
    if (!validPlans.includes(plan)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Plan must be one of: ${validPlans.join(', ')}`,
        },
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id, deletedAt: null },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found.',
          },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { plan },
        select: {
          id: true,
          email: true,
          plan: true,
        },
      });

      return reply.status(200).send({
        success: true,
        data: updatedUser,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user plan tier.',
        },
      });
    }
  });

  // 4. GET /api/v1/admin/configs - List all SystemConfig values
  fastify.get('/configs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const configs = await prisma.systemConfig.findMany({
        orderBy: { key: 'asc' },
      });

      return reply.status(200).send({
        success: true,
        data: configs,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve system configs.',
        },
      });
    }
  });

  // 5. PUT /api/v1/admin/configs/:key - Update a specific configuration key
  fastify.put('/configs/:key', async (request: FastifyRequest<{ Params: { key: string }; Body: { value: any } }>, reply: FastifyReply) => {
    const { key } = request.params;
    const { value } = request.body;

    if (value === undefined) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Configuration value is required.',
        },
      });
    }

    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key },
      });

      if (!config) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `System config key "${key}" not found.`,
          },
        });
      }

      // Convert value to number if the existing value is a number
      let typedValue = value;
      if (typeof config.value === 'number') {
        const parsed = Number(value);
        if (isNaN(parsed)) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Configuration value for "${key}" must be a valid number.`,
            },
          });
        }
        typedValue = parsed;
      }

      const updatedConfig = await prisma.systemConfig.update({
        where: { key },
        data: {
          value: typedValue,
          updatedBy: (request.user as any).email,
        },
      });

      return reply.status(200).send({
        success: true,
        data: updatedConfig,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update system config value.',
        },
      });
    }
  });

  // 6. POST /api/v1/admin/users - Create a new user (Admin only)
  fastify.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const createUserSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2),
      role: z.nativeEnum(UserRole).default(UserRole.USER),
      plan: z.nativeEnum(UserPlan).default(UserPlan.FREE),
    });

    const parse = createUserSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user parameters.',
          details: parse.error.format(),
        },
      });
    }

    const { email, password, fullName, role, plan } = parse.data;

    try {
      const existingUser = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });

      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: 'A user with this email address already exists.',
          },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role,
          plan,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          plan: true,
          isActive: true,
          createdAt: true,
        },
      });

      return reply.status(201).send({
        success: true,
        data: newUser,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create new user account.',
        },
      });
    }
  });

  // 7. DELETE /api/v1/admin/users/:id - Delete a user completely (Admin/Super Admin only)
  fastify.delete('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const currentUser = request.user as any;

    try {
      const targetUser = await prisma.user.findUnique({
        where: { id, deletedAt: null },
      });

      if (!targetUser) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found.',
          },
        });
      }

      // Prevent self-deletion
      if (targetUser.id === currentUser.sub) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'You cannot delete your own administrative account.',
          },
        });
      }

      // Role hierarchy check: only SUPER_ADMIN can delete ADMIN/SUPER_ADMIN users
      if ((targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) && currentUser.role !== UserRole.SUPER_ADMIN) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only a SUPER_ADMIN can delete other administrative accounts.',
          },
        });
      }

      // 1. Get all active WhatsApp services owned by this user
      const userServices = await prisma.whatsAppService.findMany({
        where: { userId: id, deletedAt: null }
      });

      // 2. Terminate WhatsApp connections and clean up their credential folders
      for (const service of userServices) {
        try {
          await whatsAppServiceManager.deleteInstance(service.id);
        } catch (err) {
          fastify.log.error(`Failed to delete WhatsApp instance ${service.id}: ${err}`);
        }
      }

      // 3. Perform database cleanups sequentially or in a transaction
      await prisma.$transaction([
        // Soft delete WhatsApp services
        prisma.whatsAppService.updateMany({
          where: { userId: id, deletedAt: null },
          data: {
            status: ServiceStatus.INACTIVE,
            deletedAt: new Date()
          }
        }),
        // Hard delete user sessions
        prisma.session.deleteMany({
          where: { userId: id }
        }),
        // Soft delete the user
        prisma.user.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isActive: false,
            email: `${targetUser.email}.deleted.${Date.now()}`,
            googleId: targetUser.googleId ? `${targetUser.googleId}.deleted.${Date.now()}` : null
          }
        })
      ]);

      return reply.status(200).send({
        success: true,
        data: {
          message: `User "${targetUser.fullName}" and all associated resources have been successfully deleted.`,
        }
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user account.',
        },
      });
    }
  });
}

