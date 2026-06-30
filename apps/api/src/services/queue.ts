import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { whatsAppServiceManager } from './whatsapp.js';
import { prisma } from 'database';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Define queues
export const enterpriseQueue = new Queue('enterprise', { connection });
export const proQueue = new Queue('pro', { connection });
export const freeQueue = new Queue('free', { connection });
export const bulkQueue = new Queue('bulk', { connection });
export const webhookQueue = new Queue('webhook', { connection });

// Rate limit & backoff helpers
const backoffConfig = {
  enterprise: { type: 'exponential', delay: 5000 },
  pro: { type: 'exponential', delay: 10000 },
  free: { type: 'exponential', delay: 30000 },
  bulk: { type: 'exponential', delay: 60000 },
  webhook: { type: 'exponential', delay: 10000 },
};

/**
 * Dispatches a WhatsApp text message job to the appropriate plan queue.
 */
export async function queueMessage(
  serviceId: string,
  to: string,
  message: string,
  plan: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE',
  options: any = {}
) {
  let targetQueue = freeQueue;
  let maxAttempts = 3;
  let backoffDelay = 30000;

  if (plan === 'ENTERPRISE' || plan === 'BUSINESS') {
    targetQueue = enterpriseQueue;
    maxAttempts = 5;
    backoffDelay = 5000;
  } else if (plan === 'PRO') {
    targetQueue = proQueue;
    maxAttempts = 3;
    backoffDelay = 10000;
  }

  const queueName = plan.toLowerCase();

  // Create queue job record in DB with a globally unique temporary bullJobId
  const dbJob = await prisma.queueJob.create({
    data: {
      serviceId,
      bullJobId: `temp:${queueName}:${crypto.randomUUID()}`,
      queue: queueName,
      type: 'send_message',
      status: 'WAITING',
      maxAttempts,
      payload: { to, message, options }
    }
  });

  const job = await targetQueue.add(
    'send_message',
    { serviceId, to, message, dbJobId: dbJob.id, options },
    {
      attempts: maxAttempts,
      backoff: { type: 'exponential', delay: backoffDelay },
    }
  );

  // Update BullMQ Job ID reference in Database
  // Use dbJob.id (UUID) as suffix to guarantee global uniqueness, even if BullMQ job.id collides after Redis restart
  await prisma.queueJob.update({
    where: { id: dbJob.id },
    data: { bullJobId: `${queueName}:${job.id}:${dbJob.id}` }
  });

  // Create initial message log in DB
  const messageLog = await prisma.messageLog.create({
    data: {
      serviceId,
      direction: 'OUTBOUND',
      messageType: 'TEXT',
      toNumber: to,
      status: 'QUEUED',
      queueJobId: dbJob.id,
      payload: { text: message }
    }
  });

  return { jobId: dbJob.id, messageId: messageLog.id.toString() };
}

/**
 * Core handler to execute a single message job.
 */
async function processMessageSendJob(job: Job) {
  const { serviceId, to, message, dbJobId, options } = job.data;

  console.log(`[Queue Worker] Processing job ${job.id} for service ${serviceId} to ${to}...`);

  await prisma.queueJob.update({
    where: { id: dbJobId },
    data: { status: 'ACTIVE', startedAt: new Date(), attempts: job.attemptsMade + 1 }
  });

  await prisma.messageLog.updateMany({
    where: { queueJobId: dbJobId },
    data: { status: 'PROCESSING' }
  });

  try {
    const messageId = await whatsAppServiceManager.sendTextMessage(serviceId, to, message, options);
    
    // Complete database entries
    await prisma.queueJob.update({
      where: { id: dbJobId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });

    await prisma.messageLog.updateMany({
      where: { queueJobId: dbJobId },
      data: { 
        status: 'SENT', 
        sentAt: new Date(),
        metadata: { waMessageId: messageId }
      }
    });

    console.log(`[Queue Worker] Job ${job.id} successfully completed.`);

    // Trigger message.sent webhook asynchronously
    await dispatchWebhook(serviceId, 'message.sent', {
      to,
      messageId,
      status: 'SENT',
      timestamp: new Date()
    });

  } catch (err: any) {
    console.error(`[Queue Worker] Job ${job.id} failed:`, err.message);

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 1);

    await prisma.queueJob.update({
      where: { id: dbJobId },
      data: { 
        status: isLastAttempt ? 'DLQ' : 'FAILED', 
        failedAt: new Date(), 
        errorMessage: err.message 
      }
    });

    await prisma.messageLog.updateMany({
      where: { queueJobId: dbJobId },
      data: { status: 'FAILED', errorMessage: err.message }
    });

    // Trigger message.failed webhook on final failure
    if (isLastAttempt) {
      await dispatchWebhook(serviceId, 'message.failed', {
        to,
        error: err.message,
        timestamp: new Date()
      });
    }

    throw err; // Propagate to let BullMQ handle backoff/retries
  }
}

/**
 * Dispatches events to the Webhook delivery queue
 */
export async function dispatchWebhook(serviceId: string, event: string, payload: any) {
  // Find active webhook configuration for this service
  const webhookConfig = await prisma.webhookConfig.findFirst({
    where: { serviceId, isActive: true }
  });

  if (!webhookConfig) return;

  await webhookQueue.add(
    'deliver_webhook',
    { webhookConfigId: webhookConfig.id, event, payload },
    {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10000 }
    }
  );
}

// ═══════════════════════════════════════════
// WORKERS POOL INITIALIZATION
// ═══════════════════════════════════════════

export const enterpriseWorker = new Worker('enterprise', processMessageSendJob, {
  connection,
  concurrency: 20
});

export const proWorker = new Worker('pro', processMessageSendJob, {
  connection,
  concurrency: 10
});

export const freeWorker = new Worker('free', processMessageSendJob, {
  connection,
  concurrency: 3
});

export const bulkWorker = new Worker('bulk', processMessageSendJob, {
  connection,
  concurrency: 5
});

// Logs worker events
const logWorkerEvents = (name: string, worker: Worker) => {
  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker ${name}] Job ${job?.id} failed:`, err);
  });
  worker.on('error', (err) => {
    console.error(`[BullMQ Worker ${name}] Error:`, err);
  });
};

logWorkerEvents('Enterprise', enterpriseWorker);
logWorkerEvents('Pro', proWorker);
logWorkerEvents('Free', freeWorker);
logWorkerEvents('Bulk', bulkWorker);
