import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from the current directory or workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL environment variable is required',
  }),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Auth keys (pem format or fallback)
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // AES 256 GCM encryption key for WhatsApp sessions (must be 32 bytes/characters)
  ENCRYPTION_KEY: z.string().min(32, {
    message: 'ENCRYPTION_KEY must be at least 32 characters long for AES-256-GCM encryption',
  }).default('wavo_secure_session_encryption_key_32_bytes_long_secret'),
  
  // Storage settings
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('wavo-storage'),
  MINIO_USE_SSL: z.preprocess((val) => val === 'true', z.boolean()).default(false),
  
  // Frontend & App URLs
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),

  // OAuth Credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Optional SMTP settings
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@wavo.dev'),
  
  // Logging & Observability
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
