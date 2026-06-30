import crypto from 'crypto';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { prisma, DeliveryStatus } from 'database';
import { nanoid } from 'nanoid';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * Calculates the HMAC SHA-256 signature of the payload.
 */
function calculateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Worker that handles webhook deliveries from the 'webhook' BullMQ queue.
 */
export const webhookWorker = new Worker(
  'webhook',
  async (job: Job) => {
    const { webhookConfigId, event, payload } = job.data;

    console.log(`[Webhook Worker] Processing delivery ${job.id} for config ${webhookConfigId}...`);

    // Retrieve webhook config
    const config = await prisma.webhookConfig.findUnique({
      where: { id: webhookConfigId }
    });

    if (!config || !config.isActive) {
      console.log(`[Webhook Worker] Webhook config ${webhookConfigId} not found or inactive. Skipping.`);
      return;
    }

    const payloadString = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString()
    });

    const signature = calculateSignature(payloadString, config.secret);

    // Create a pending delivery log entry
    const deliveryLog = await prisma.webhookDeliveryLog.create({
      data: {
        id: `wdl_${nanoid(10)}`,
        webhookId: webhookConfigId,
        event,
        payload: JSON.parse(payloadString),
        status: DeliveryStatus.PENDING,
        attempts: job.attemptsMade + 1,
      }
    });

    const startTime = Date.now();

    try {
      // Build abort controller for timeout (10 seconds per PRD Section 16)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wavo-Signature': signature,
          'X-Wavo-Event': event,
          'User-Agent': 'Wavo-Webhook-Dispatcher/3.0'
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      const responseBody = await response.text();

      const isSuccess = response.status >= 200 && response.status < 300;

      await prisma.webhookDeliveryLog.update({
        where: { id: deliveryLog.id },
        data: {
          status: isSuccess ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000), // Limit storage size
          duration,
        }
      });

      if (!isSuccess) {
        throw new Error(`Webhook consumer returned status code ${response.status}`);
      }

      console.log(`[Webhook Worker] Delivery successful to ${config.url}`);

    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`[Webhook Worker] Webhook delivery failed:`, err.message);

      const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 1);

      await prisma.webhookDeliveryLog.update({
        where: { id: deliveryLog.id },
        data: {
          status: isLastAttempt ? DeliveryStatus.DLQ : DeliveryStatus.FAILED,
          lastError: err.message,
          duration,
        }
      });

      throw err; // Propagate to trigger BullMQ retry/backoff
    }
  },
  {
    connection,
    concurrency: 10
  }
);

webhookWorker.on('failed', (job, err) => {
  console.error(`[Webhook Worker] Job ${job?.id} failed on final attempt:`, err);
});
