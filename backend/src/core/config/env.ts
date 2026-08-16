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
} as const;

export type Env = typeof env;
