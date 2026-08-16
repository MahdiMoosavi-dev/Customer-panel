import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SERVICE, type TokenService } from '@/core';
import { toHttpException } from './to-http-exception';

function extractBearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : undefined;
}

/**
 * Verifies the bearer token through the `TokenService` port — not passport
 * — so a failure becomes the same `AppError` → HTTP status mapping every
 * other feature uses. Lives here rather than inside `features/auth/` so
 * any feature can `@UseGuards(JwtAuthGuard)` without importing the auth
 * feature and creating a circular module dependency (auth itself depends
 * on users; a feature depending on auth for the guard while auth depends
 * on it for verification would cycle back). See docs/08-decisions.md.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const result = await this.tokenService.verify(token);
    if (!result.ok) {
      throw toHttpException(result.error);
    }

    request.user = result.value;
    return true;
  }
}
