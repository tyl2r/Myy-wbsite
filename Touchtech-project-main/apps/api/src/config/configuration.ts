import { Env } from './env.validation';

/**
 * Maps the flat, validated env into typed namespaces consumed via
 * ConfigService. Keeping access typed avoids stringly-typed `get('JWT_...')`
 * scattered across the codebase.
 */
export const configuration = (env: Env) => ({
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS,
    isProd: env.NODE_ENV === 'production',
  },
  db: {
    url: env.DATABASE_URL,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  throttle: {
    ttl: env.THROTTLE_TTL,
    limit: env.THROTTLE_LIMIT,
  },
});

export type AppConfig = ReturnType<typeof configuration>;
