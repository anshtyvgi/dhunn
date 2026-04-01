export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  frontendUrl: process.env.FRONTEND_URL,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiTextModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',
  geminiImageModel:
    process.env.GEMINI_IMAGE_MODEL ??
    'gemini-2.0-flash-preview-image-generation',
  wanApiKey: process.env.WAN_API_KEY,
  wanBaseUrl: process.env.WAN_BASE_URL ?? 'https://api.wavespeed.ai/api/v3',
  wanAudioModel:
    process.env.WAN_AUDIO_MODEL ?? 'wavespeed-ai/ace-step-1.5',
  paymentsWebhookSecret: process.env.PAYMENTS_WEBHOOK_SECRET,
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    endpoint: process.env.R2_ENDPOINT,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  },
  pricing: {
    dedicateGenerationCost: parseInt(
      process.env.DEDICATE_GENERATION_COST ?? '6',
      10,
    ),
    initialFreeCoins: parseInt(process.env.INITIAL_FREE_COINS ?? '20', 10),
  },
  polling: {
    timeoutMs: parseInt(process.env.SESSION_POLL_TIMEOUT_MS ?? '420000', 10),
    intervalMs: parseInt(process.env.SESSION_POLL_INTERVAL_MS ?? '5000', 10),
  },
});
