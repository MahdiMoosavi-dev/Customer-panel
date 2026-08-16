/**
 * Single place where raw environment variables are read and given defaults.
 * `NEXT_PUBLIC_*` names must be written out in full so Next.js can inline them.
 */
export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Customer Panel",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() ||
    "A Next.js starter with a feature-based clean architecture.",
} as const;

export type Env = typeof env;
