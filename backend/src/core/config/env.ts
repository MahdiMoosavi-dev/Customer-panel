import 'dotenv/config';

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Single place where raw environment variables are read and given defaults. */
export const env = {
  port: readNumber(process.env.PORT, 4000),
  apiPrefix: process.env.API_PREFIX?.trim() || 'api',
  appName: process.env.APP_NAME?.trim() || 'Customer Panel',
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
  jwtSecret: process.env.JWT_SECRET?.trim() || 'dev-secret-change-me',
  jwtExpiresInSeconds: readNumber(process.env.JWT_EXPIRES_IN_SECONDS, 3600),
} as const;

export type Env = typeof env;
