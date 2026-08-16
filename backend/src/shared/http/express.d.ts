import type { TokenPayload } from '@/core';

/** Set by JwtAuthGuard once a bearer token has been verified. */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
