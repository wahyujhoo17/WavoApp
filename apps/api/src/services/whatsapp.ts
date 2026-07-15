import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  delay,
  makeCacheableSignalKeyStore,
  proto
} from '@whiskeysockets/baileys';
import { prisma, ServiceStatus } from 'database';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs/promises';
import { Boom } from '@hapi/boom';
import { storageService } from './storage.js';
import { dispatchWebhook } from './queue.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { Server as SocketServer } from 'socket.io';
import pino from 'pino';
const SESSION_DIR = path.resolve(process.cwd(), 'storage/sessions');

export class WhatsAppServiceManager {
  private static instance: WhatsAppServiceManager;
  private activeSockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private socketIO: SocketServer | null = null;
  // Store sent messages so WhatsApp retries can find the original content
  private sentMessages: Map<string, proto.IMessage> = new Map();

  private constructor() {}

  public static getInstance(): WhatsAppServiceManager {
    if (!WhatsAppServiceManager.instance) {
      WhatsAppServiceManager.instance = new WhatsAppServiceManager();
    }
    return WhatsAppServiceManager.instance;
  }

  public setSocketIO(io: SocketServer) {
    this.socketIO = io;
  }

  private broadcast(serviceId: string, event: string, data: any) {
    if (this.socketIO) {
      // Broadcast to specific service room
      this.socketIO.to(`service:${serviceId}`).emit(event, data);
      // Also broadcast to admin room
      this.socketIO.to('admin').emit(`admin:${event}`, { serviceId, ...data });
    }
  }

  /**
   * Restores all sessions that were marked as CONNECTED or CONNECTING on boot.
   */
  public async restoreSessions() {
    try {
      const services = await prisma.whatsAppService.findMany({
        where: {
          status: {
            in: [ServiceStatus.CONNECTED, ServiceStatus.CONNECTING, ServiceStatus.QR_PENDING]
          },
          deletedAt: null
        }
      });

      console.log(`[WA Engine] Found ${services.length} active sessions to restore...`);
      for (const service of services) {
        this.initInstance(service.id, service.slug).catch(err => {
          console.error(`[WA Engine] Failed to restore session ${service.slug}:`, err);
        });
      }
    } catch (err) {
      console.error('[WA Engine] Error restoring sessions:', err);
    }
  }

  /**
   * Initializes a WhatsApp instance for a given service.
   */
  public async initInstance(serviceId: string, slug: string): Promise<WASocket> {
    // If already active, return the existing socket
    if (this.activeSockets.has(serviceId)) {
      return this.activeSockets.get(serviceId)!;
    }

    console.log(`[WA Engine] Initializing instance for ${slug} (${serviceId})...`);
    
    // Update status to CONNECTING in DB
    await prisma.whatsAppService.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.CONNECTING }
    });
    this.broadcast(serviceId, 'service:status', { serviceId, status: ServiceStatus.CONNECTING });

    const localAuthPath = path.join(SESSION_DIR, serviceId);
    await fs.mkdir(localAuthPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(localAuthPath);
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: 'silent' });
    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ['Wavo Platform', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
      getMessage: async (key) => {
        const msgId = key.id;
        if (msgId && this.sentMessages.has(msgId)) {
          return this.sentMessages.get(msgId)!;
        }
        // Fallback: return empty so Baileys doesn't crash
        return { conversation: '' };
      }
    });

    this.activeSockets.set(serviceId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCodes.set(serviceId, qr);
        console.log(`[WA Engine] New QR generated for service ${slug}`);
        
        await prisma.whatsAppService.update({
          where: { id: serviceId },
          data: { status: ServiceStatus.QR_PENDING }
        });
        
        this.broadcast(serviceId, 'service:qr', {
          serviceId,
          qr,
          expiresIn: 60
        });
        this.broadcast(serviceId, 'service:status', { serviceId, status: ServiceStatus.QR_PENDING });
      }

      if (connection === 'open') {
        const phoneNumber = sock.user?.id.split(':')[0];
        console.log(`[WA Engine] WhatsApp Connected for ${slug} with number ${phoneNumber}`);
        
        this.qrCodes.delete(serviceId);
        
        await prisma.whatsAppService.update({
          where: { id: serviceId },
          data: { 
            status: ServiceStatus.CONNECTED,
            phoneNumber
          }
        });

        this.broadcast(serviceId, 'service:status', { 
          serviceId, 
          status: ServiceStatus.CONNECTED,
          phoneNumber
        });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        
        // If it timed out while waiting for QR scan
        const isQrTimeout = statusCode === DisconnectReason.timedOut && this.qrCodes.has(serviceId);
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !isQrTimeout;

        console.log(`[WA Engine] Connection closed for ${slug}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
        
        this.activeSockets.delete(serviceId);
        this.qrCodes.delete(serviceId);

        if (shouldReconnect) {
          // Reconnect with a delay
          await prisma.whatsAppService.update({
            where: { id: serviceId },
            data: { status: ServiceStatus.DISCONNECTED }
          });
          this.broadcast(serviceId, 'service:status', { serviceId, status: ServiceStatus.DISCONNECTED });

          setTimeout(() => {
            this.initInstance(serviceId, slug).catch(err => {
              console.error(`[WA Engine] Reconnection failed for ${slug}:`, err);
            });
          }, 5000);
        } else {
          // Logged out or QR scan timeout (1 minute)
          console.log(`[WA Engine] Service ${slug} stopped. Reason: ${isQrTimeout ? 'QR Timeout' : 'Logged Out'}`);
          
          await prisma.whatsAppService.update({
            where: { id: serviceId },
            data: { 
              status: ServiceStatus.INACTIVE,
              ...(isQrTimeout ? {} : { phoneNumber: null }) // only clear phone number if actually logged out
            }
          });
          this.broadcast(serviceId, 'service:status', { serviceId, status: ServiceStatus.INACTIVE });

          // Clean up auth files only if logged out, not if just QR timeout
          if (!isQrTimeout) {
            try {
              await fs.rm(localAuthPath, { recursive: true, force: true });
            } catch (err) {
              console.error('[WA Engine] Error cleaning up auth folder:', err);
            }
          }
        }
      }
    });

    // Listen to incoming messages
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          // Resolve real phone number from LID
          // Priority: senderPn > remoteJidAlt > participantAlt > participant > remoteJid
          const keyAny = msg.key as any;
          let senderJid = 
            keyAny.senderPn ||              // Baileys v6+: real phone in senderPn
            keyAny.remoteJidAlt ||           // Baileys v7: alt field with real number
            keyAny.participantAlt ||         // Baileys v7: group participant alt
            msg.key.participant ||           // Group messages
            msg.key.remoteJid ||             // Direct messages
            '';
          
          // If we still got a LID (@lid), try to extract phone from pushName or notify
          // Strip the @s.whatsapp.net or @lid suffix
          let from = senderJid.split('@')[0] || '';
          
          // Log all available key fields for debugging
          console.log(`[WA Engine] Incoming message key data:`, JSON.stringify({
            remoteJid: msg.key.remoteJid,
            senderPn: keyAny.senderPn,
            remoteJidAlt: keyAny.remoteJidAlt,
            participantAlt: keyAny.participantAlt,
            participant: msg.key.participant,
            resolvedFrom: from
          }));

          // Also capture the group ID if it's from a group
          const isGroup = msg.key.remoteJid?.endsWith('@g.us');
          const groupId = isGroup ? msg.key.remoteJid?.split('@')[0] : null;

          const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
          
          if (!body) continue;

          console.log(`[WA Engine] Incoming message from ${from}: ${body}`);

          // Trigger webhook for incoming message
          dispatchWebhook(serviceId, 'message.received', {
            from,
            message: body,
            timestamp: new Date()
          }).catch(err => console.error('[WA Engine] Error dispatching webhook:', err));

          // Broadcast message event
          this.broadcast(serviceId, 'service:message', {
            serviceId,
            from,
            message: body,
            type: 'TEXT',
            timestamp: new Date()
          });

          // Log in database as INBOUND
          try {
            await prisma.messageLog.create({
              data: {
                id: `log_${nanoid(10)}`,
                serviceId,
                direction: 'INBOUND',
                messageType: 'TEXT',
                toNumber: sock.user?.id.split(':')[0] || '',
                fromNumber: from,
                status: 'DELIVERED',
                payload: { text: body }
              }
            });
          } catch (err) {
            console.error('[WA Engine] Error logging incoming message:', err);
          }
        }
      }
    });

    return sock;
  }

  /**
   * Gracefully disconnects a WhatsApp instance.
   */
  public async disconnectInstance(serviceId: string): Promise<void> {
    const sock = this.activeSockets.get(serviceId);
    if (sock) {
      console.log(`[WA Engine] Disconnecting service instance ${serviceId}...`);
      await sock.logout();
      this.activeSockets.delete(serviceId);
    }
  }

  /**
   * Force deletes local authentication files and disconnects.
   */
  public async deleteInstance(serviceId: string): Promise<void> {
    await this.disconnectInstance(serviceId);
    const localAuthPath = path.join(SESSION_DIR, serviceId);
    try {
      await fs.rm(localAuthPath, { recursive: true, force: true });
    } catch (err) {
      console.error('[WA Engine] Failed to delete auth folder:', err);
    }
  }

  /**
   * Sends a text message through the given WhatsApp instance.
   */
  public async sendTextMessage(serviceId: string, to: string, text: string, options: any = {}): Promise<string> {
    const sock = this.activeSockets.get(serviceId);
    if (!sock) {
      throw new Error('WhatsApp service instance is not connected');
    }

    const jid = `${to}@s.whatsapp.net`;

    // Anti-ban typing simulation if enabled
    if (options.typingDelay) {
      await sock.sendPresenceUpdate('composing', jid);
      await delay(Math.random() * 2000 + 1000); // 1-3s delay
      await sock.sendPresenceUpdate('paused', jid);
    }

    const result = await sock.sendMessage(jid, { text });

    // Store sent message for retry handling
    if (result?.key.id) {
      this.sentMessages.set(result.key.id, result.message!);
      // Auto-cleanup after 10 minutes to prevent memory leak
      setTimeout(() => this.sentMessages.delete(result.key.id!), 10 * 60 * 1000);
    }

    return result?.key.id || 'sent_fallback';
  }

  /**
   * Sends an image message through the given WhatsApp instance.
   */
  public async sendImageMessage(serviceId: string, to: string, imageBuffer: Buffer, caption?: string): Promise<string> {
    const sock = this.activeSockets.get(serviceId);
    if (!sock) {
      throw new Error('WhatsApp service instance is not connected');
    }

    const jid = `${to}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption
    });

    // Store sent message for retry handling
    if (result?.key.id) {
      this.sentMessages.set(result.key.id, result.message!);
      setTimeout(() => this.sentMessages.delete(result.key.id!), 10 * 60 * 1000);
    }

    return result?.key.id || 'sent_fallback';
  }

  public getQR(serviceId: string): string | null {
    return this.qrCodes.get(serviceId) || null;
  }

  public getActiveSocket(serviceId: string): WASocket | null {
    return this.activeSockets.get(serviceId) || null;
  }
}

export const whatsAppServiceManager = WhatsAppServiceManager.getInstance();
