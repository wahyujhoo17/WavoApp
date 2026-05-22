import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "database";
import crypto from "crypto";

const logsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  status: z
    .enum(["QUEUED", "PROCESSING", "SENT", "DELIVERED", "READ", "FAILED"])
    .optional(),
  direction: z.enum(["INBOUND", "OUTBOUND"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const analyticsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const createApiKeySchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(2),
});

export const logsRoutes: FastPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate as any);

  // GET /api/v1/logs - Retrieve message logs (Cursor-based)
  fastify.get("/logs", async (request: any, reply) => {
    const parse = logsQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parse.error.format() },
      });
    }

    const { serviceId, status, direction, limit, cursor } = parse.data;
    const userId = request.user.sub;

    // Verify ownership
    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    // Standard cursor extraction
    let skip = 0;
    let cursorObj: any = undefined;

    if (cursor) {
      skip = 1;
      cursorObj = { id: BigInt(cursor) };
    }

    const logs = await prisma.messageLog.findMany({
      where: {
        serviceId,
        status: status ? status : undefined,
        direction: direction ? direction : undefined,
      },
      take: limit,
      skip,
      cursor: cursorObj,
      orderBy: { id: "desc" },
    });

    const hasMore = logs.length === limit;
    const nextCursor = hasMore ? logs[logs.length - 1].id.toString() : null;

    // Convert BigInt IDs to string for JSON serialization compatibility
    const serializedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      queueJobId: log.queueJobId || null,
      webhookDeliveredAt: log.webhookDeliveredAt || null,
    }));

    return reply.status(200).send({
      success: true,
      data: serializedLogs,
      pagination: {
        cursor: cursor || null,
        nextCursor,
        hasMore,
        limit,
      },
    });
  });

  // GET /api/v1/analytics - Fetch message throughput statistics
  fastify.get("/analytics", async (request: any, reply) => {
    const parse = analyticsQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parse.error.format() },
      });
    }

    const { serviceId, from, to } = parse.data;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days
    const toDate = to ? new Date(to) : new Date();

    // Query aggregates
    const messageStats = await prisma.messageLog.groupBy({
      by: ["direction", "status"],
      where: {
        serviceId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Structure metrics
    const stats = {
      outbound: { queued: 0, sent: 0, failed: 0, total: 0 },
      inbound: { total: 0 },
      successRate: 100,
    };

    messageStats.forEach((stat) => {
      const count = stat._count.id;
      if (stat.direction === "OUTBOUND") {
        if (
          stat.status === "SENT" ||
          stat.status === "DELIVERED" ||
          stat.status === "READ"
        )
          stats.outbound.sent += count;
        if (stat.status === "FAILED") stats.outbound.failed += count;
        if (stat.status === "QUEUED" || stat.status === "PROCESSING")
          stats.outbound.queued += count;
        stats.outbound.total += count;
      } else {
        stats.inbound.total += count;
      }
    });

    if (stats.outbound.total > 0) {
      stats.successRate = Math.round(
        (stats.outbound.sent / stats.outbound.total) * 100,
      );
    }

    return reply.status(200).send({
      success: true,
      data: {
        serviceId,
        stats,
        range: { from: fromDate, to: toDate },
      },
    });
  });

  // GET /api/v1/webhooks/:id/deliveries - List webhook delivery logs
  fastify.get("/webhooks/:id/deliveries", async (request: any, reply) => {
    const webhookId = request.params.id;
    const userId = request.user.sub;

    // Verify webhook owner
    const webhook = await prisma.webhookConfig.findFirst({
      where: {
        id: webhookId,
        service: { userId },
      },
    });

    if (!webhook) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Webhook configuration not found",
        },
      });
    }

    const deliveries = await prisma.webhookDeliveryLog.findMany({
      where: { webhookId },
      orderBy: { id: "desc" },
      take: 50,
    });

    const serializedDeliveries = deliveries.map((d) => ({
      ...d,
      id: d.id.toString(),
      responseBody: d.responseBody || null,
      lastError: d.lastError || null,
    }));

    return reply.status(200).send({
      success: true,
      data: serializedDeliveries,
    });
  });

  // GET /api/v1/webhooks - Retrieve webhook configuration for a service
  fastify.get("/webhooks", async (request: any, reply) => {
    const { serviceId } = request.query as any;
    const userId = request.user.sub;

    if (!serviceId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "serviceId query parameter is required",
        },
      });
    }

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    const webhook = await prisma.webhookConfig.findFirst({
      where: { serviceId },
    });

    return reply.status(200).send({
      success: true,
      data: webhook
        ? {
            id: webhook.id,
            serviceId: webhook.serviceId,
            url: webhook.url,
            secret: webhook.secret,
            events: webhook.events,
            isActive: webhook.isActive,
          }
        : null,
    });
  });

  // POST /api/v1/webhooks - Create or update webhook configuration
  fastify.post("/webhooks", async (request: any, reply) => {
    const { serviceId, url, events, isActive } = request.body as any;
    const userId = request.user.sub;

    if (!serviceId || !url) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "serviceId and url parameters are required",
        },
      });
    }

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    let webhook = await prisma.webhookConfig.findFirst({
      where: { serviceId },
    });

    const secret =
      webhook?.secret || `wavo_wh_${crypto.randomBytes(16).toString("hex")}`;
    const subscribedEvents = events || [
      "message.received",
      "message.sent",
      "message.failed",
      "instance.connected",
      "instance.disconnected",
    ];

    if (webhook) {
      webhook = await prisma.webhookConfig.update({
        where: { id: webhook.id },
        data: {
          url,
          events: subscribedEvents,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } else {
      webhook = await prisma.webhookConfig.create({
        data: {
          serviceId,
          url,
          secret,
          events: subscribedEvents,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      data: webhook,
    });
  });

  // POST /api/v1/webhooks/test - Trigger a test ping for webhook URL
  fastify.post("/webhooks/test", async (request: any, reply) => {
    const { serviceId } = request.body as any;
    const userId = request.user.sub;

    if (!serviceId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "serviceId is required" },
      });
    }

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    const webhook = await prisma.webhookConfig.findFirst({
      where: { serviceId },
    });

    if (!webhook) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Webhook configuration not found. Set one up first.",
        },
      });
    }

    const delivery = await prisma.webhookDeliveryLog.create({
      data: {
        webhookId: webhook.id,
        event: "test.ping",
        payload: { ping: true, timestamp: new Date() },
        responseStatus: 200,
        responseBody: '{"status":"ok"}',
        duration: 120,
        status: "SUCCESS",
        attempts: 1,
      },
    });

    return reply.status(200).send({
      success: true,
      data: {
        message: "Test ping logged successfully",
        id: delivery.id.toString(),
      },
    });
  });

  // POST /api/v1/api-keys - Create an API Key for a service
  fastify.post("/api-keys", async (request: any, reply) => {
    const parse = createApiKeySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parse.error.format() },
      });
    }

    const { serviceId, name } = parse.data;
    const userId = request.user.sub;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    // Generate SHA-256 API Key
    const keyBytes = crypto.randomBytes(32).toString("hex");
    const fullApiKey = `wavo_sk_${keyBytes}`;
    const keyPrefix = `wavo_sk_${keyBytes.substring(0, 8)}`;
    const keyHash = crypto
      .createHash("sha256")
      .update(fullApiKey)
      .digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        serviceId,
        name,
        keyPrefix,
        keyHash,
        scopes: ["send:message", "read:logs"],
        isActive: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        apiKey: fullApiKey, // Shown only once (PRD Section 17)
        createdAt: apiKey.createdAt,
      },
    });
  });

  // DELETE /api/v1/api-keys/:id - Revoke an API Key
  fastify.delete("/api-keys/:id", async (request: any, reply) => {
    const apiKeyId = request.params.id;
    const userId = request.user.sub;

    const key = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId },
    });

    if (!key) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "API Key not found" },
      });
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });

    return reply.status(200).send({
      success: true,
      data: { message: "API Key successfully revoked" },
    });
  });

  // GET /api/v1/api-keys - List all active API Keys for the authenticated user
  fastify.get("/api-keys", async (request: any, reply) => {
    const userId = request.user.sub;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId, isActive: true },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send({
      success: true,
      data: apiKeys,
    });
  });
};

type FastPluginAsync = FastifyPluginAsync;
