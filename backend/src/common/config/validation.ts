import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  WAN_API_KEY: z.string().min(1),
  PAYMENTS_WEBHOOK_SECRET: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url(),
});

export function validate(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
