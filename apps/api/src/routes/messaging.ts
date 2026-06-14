import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma, ServiceStatus, UserPlan } from "database";
import { queueMessage, freeQueue } from "../services/queue.js";
import { whatsAppServiceManager } from "../services/whatsapp.js";

const textMessageSchema = z.object({
  serviceId: z.string().uuid(),
  to: z
    .string()
    .regex(/^\d{10,15}$/, {
      message: "Phone number must be E.164 format digits only (10-15 chars)",
    }),
  message: z.string().max(4096),
  options: z
    .object({
      typingDelay: z.boolean().default(true),
      quotedMessageId: z.string().nullable().default(null),
    })
    .default({ typingDelay: true, quotedMessageId: null }),
});

const bulkMessageSchema = z.object({
  serviceId: z.string().uuid(),
  recipients: z
    .array(z.string().regex(/^\d{10,15}$/))
    .max(500, { message: "Maximum of 500 recipients allowed" }),
  message: z.string().max(4096),
  options: z
    .object({
      typingDelay: z.boolean().default(true),
      interMessageDelay: z.number().min(1).max(60).default(5),
    })
    .default({ typingDelay: true, interMessageDelay: 5 }),
});

export const messagingRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  // Support either API key validation or Standard Session JWT auth
  const resolveAuth = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer wavo_sk_")) {
      await fastify.validateApiKey(request, reply);
    } else {
      await fastify.authenticate(request, reply);

      // Load user object from database into request.user to get Plan info
      const dbUser = await prisma.user.findUnique({
        where: { id: request.user.sub },
      });
      if (!dbUser) {
        return reply.status(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        });
      }
      request.dbUser = dbUser;
    }
  };

  fastify.addHook("preHandler", resolveAuth);

  // POST /api/v1/send/text
  fastify.post("/text", async (request: any, reply) => {
    const parse = textMessageSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid messaging request parameters",
          details: parse.error.format(),
        },
      });
    }

    const { serviceId, to, message, options } = parse.data;

    // Resolve user & plan details
    const user = request.dbUser || request.user;
    const plan = user.plan as UserPlan;

    // Verify WhatsApp service ownership & status
    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId: user.id, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    if (service.status !== ServiceStatus.CONNECTED) {
      return reply.status(422).send({
        success: false,
        error: {
          code: "INSTANCE_NOT_CONNECTED",
          message:
            "WhatsApp instance is not connected. Please connect the service first.",
        },
      });
    }

    // Daily Limit Quota check (Section 8)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sentTodayCount = await prisma.messageLog.count({
      where: {
        serviceId,
        direction: "OUTBOUND",
        createdAt: { gte: todayStart },
      },
    });

    let dailyLimit = 100; // FREE
    if (plan === "PRO") dailyLimit = 5000;
    else if (plan === "BUSINESS") dailyLimit = 50000;
    else if (plan === "ENTERPRISE") dailyLimit = 99999999; // Unlimited

    // Load dynamic daily limit from SystemConfig in DB if available
    try {
      const configKey = `rate_limit.${plan.toLowerCase()}.daily`;
      const systemConfig = await prisma.systemConfig.findUnique({
        where: { key: configKey },
      });
      if (systemConfig && typeof systemConfig.value === "number") {
        dailyLimit = systemConfig.value;
      }
    } catch (err) {
      // Fallback to static plan values silently
    }

    if (sentTodayCount >= dailyLimit) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "PLAN_LIMIT_EXCEEDED",
          message: `Daily message quota of ${dailyLimit} messages has been exceeded for your ${plan} plan`,
        },
      });
    }

    // Dispatch message to queue
    const { jobId, messageId } = await queueMessage(
      serviceId,
      to,
      message,
      plan,
      options,
    );

    // Retrieve BullMQ queue position (approximation)
    const activeJobsCount = await freeQueue.getActiveCount();
    const waitingJobsCount = await freeQueue.getWaitingCount();

    return reply.status(202).send({
      success: true,
      data: {
        messageId,
        status: "QUEUED",
        queuePosition: activeJobsCount + waitingJobsCount + 1,
        estimatedDelivery: new Date(Date.now() + 5000), // 5s estimate
      },
    });
  });

  // POST /api/v1/send/bulk
  fastify.post("/bulk", async (request: any, reply) => {
    const parse = bulkMessageSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid bulk parameters",
          details: parse.error.format(),
        },
      });
    }

    const { serviceId, recipients, message, options } = parse.data;
    const user = request.dbUser || request.user;
    const plan = user.plan as UserPlan;

    // Bulk messaging is blocked on Free plan (PRD Section 7)
    if (plan === UserPlan.FREE) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Bulk messaging is only available on paid tier plans (Pro/Business/Enterprise)",
        },
      });
    }

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId: user.id, deletedAt: null },
    });

    if (!service) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "WhatsApp Service not found" },
      });
    }

    if (service.status !== ServiceStatus.CONNECTED) {
      return reply.status(422).send({
        success: false,
        error: {
          code: "INSTANCE_NOT_CONNECTED",
          message: "WhatsApp instance is not connected",
        },
      });
    }

    console.log(
      `[Bulk API] Received bulk request for ${recipients.length} recipients.`,
    );

    // Batch send sequentially by queueing single messages into the worker
    const messageDetails: any[] = [];
    for (const recipient of recipients) {
      const { jobId, messageId } = await queueMessage(
        serviceId,
        recipient,
        message,
        plan,
        {
          typingDelay: options.typingDelay,
        },
      );
      messageDetails.push({ recipient, messageId });

      // Add slight staggered delay between queue additions
      await new Promise((resolve) =>
        setTimeout(resolve, options.interMessageDelay * 1000),
      );
    }

    return reply.status(202).send({
      success: true,
      data: {
        batchId: crypto.randomUUID(),
        totalRecipients: recipients.length,
        status: "QUEUED",
        estimatedCompletion: new Date(
          Date.now() + recipients.length * options.interMessageDelay * 1000,
        ),
      },
    });
  });

  // POST /api/v1/send/image (Multipart upload)
  fastify.post("/image", async (request: any, reply) => {
    if (!request.isMultipart()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Multipart/form-data content-type expected",
        },
      });
    }

    const parts = request.parts();
    let serviceId = "";
    let to = "";
    let caption = "";
    let fileBuffer: Buffer | null = null;

    for await (const part of parts) {
      if (part.file) {
        fileBuffer = await part.toBuffer();
      } else {
        if (part.fieldname === "serviceId") serviceId = part.value;
        if (part.fieldname === "to") to = part.value;
        if (part.fieldname === "caption") caption = part.value;
      }
    }

    if (!serviceId || !to || !fileBuffer) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing fields: serviceId, to, and image file are required",
        },
      });
    }

    const user = request.dbUser || request.user;

    const service = await prisma.whatsAppService.findFirst({
      where: { id: serviceId, userId: user.id, deletedAt: null },
    });

    if (!service || service.status !== ServiceStatus.CONNECTED) {
      return reply.status(422).send({
        success: false,
        error: {
          code: "INSTANCE_NOT_CONNECTED",
          message: "WhatsApp instance not found or not connected",
        },
      });
    }

    try {
      // Direct send for media to prevent queue delays with heavy uploads
      const waMsgId = await whatsAppServiceManager.sendImageMessage(
        serviceId,
        to,
        fileBuffer,
        caption,
      );

      const dbLog = await prisma.messageLog.create({
        data: {
          serviceId,
          direction: "OUTBOUND",
          messageType: "IMAGE",
          toNumber: to,
          status: "SENT",
          payload: { caption },
          metadata: { waMessageId: waMsgId },
        },
      });

      return reply.status(200).send({
        success: true,
        data: {
          messageId: dbLog.id,
          status: "SENT",
          waMessageId: waMsgId,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: "WHATSAPP_ERROR", message: err.message },
      });
    }
  });
};
