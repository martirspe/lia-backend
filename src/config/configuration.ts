import * as path from 'path';

const toInt = (val: string | undefined, def: number) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : def;
};

const toBool = (val: string | undefined, def: boolean) => {
  if (val === undefined) return def;
  return /^(1|true|yes|on)$/i.test(String(val));
};

const configuration = () => {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    app: {
      name: process.env.APP_NAME ?? 'Lia Platform',
      port: toInt(process.env.APP_PORT, 3000),
      url: process.env.API_URL ?? 'http://localhost:3000',
      frontendUrl: process.env.APP_URL ?? 'http://localhost:4200',
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
      defaultTtlSeconds: toInt(process.env.REDIS_TTL_SECONDS, 300),
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? 'change-me-in-prod',
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    },
    files: {
      dir: process.env.FILES_DIR ?? path.join(process.cwd(), 'storage', 'uploads'),
      maxSizeMb: toInt(process.env.FILES_MAX_SIZE_MB, 20),
      allowedExtensions: process.env.FILES_ALLOWED_EXTENSIONS ?? '.pdf,.docx,.txt,.md,.pptx,.xlsx',
    },
    rag: {
      enabled: toBool(process.env.RAG_ENABLED, true),
      chunking: {
        maxLen: toInt(process.env.RAG_CHUNK_MAX_LEN, 1200),
        overlap: toInt(process.env.RAG_CHUNK_OVERLAP, 150),
      },
      embeddings: {
        provider: process.env.EMBEDDINGS_PROVIDER ?? 'openai',
        model: process.env.EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
        dim: toInt(process.env.EMBEDDINGS_DIM, 1536),
      },
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      llmModel: process.env.OPENAI_LLM_MODEL ?? 'gpt-4o-mini',
    },
    qdrant: {
      url: process.env.QDRANT_URL ?? 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY ?? null,
      collectionPrefix: process.env.QDRANT_COLLECTION_PREFIX ?? 'lia_',
    },
    stripe: {
      enabled: toBool(process.env.STRIPE_ENABLED, false),
      secretKey: process.env.STRIPE_SECRET_KEY ?? null,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
    },
    security: {
      rateLimitPerMinute: toInt(process.env.SECURITY_RATE_LIMIT_PER_MINUTE, 120),
      corsOrigin: process.env.SECURITY_CORS_ORIGIN ?? '*',
      enableHelmet: toBool(process.env.ENABLE_HELMET, true),
    },
    logging: {
      level: process.env.LOG_LEVEL ?? 'info',
      pretty: toBool(process.env.LOG_PRETTY, true),
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
export default configuration;