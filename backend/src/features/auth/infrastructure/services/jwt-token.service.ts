import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  err,
  ok,
  UnauthorizedError,
  type AppError,
  type Result,
  type TokenPayload,
  type TokenService,
} from '@/core';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync({
      sub: payload.sub,
      email: payload.email,
    });
  }

  async verify(token: string): Promise<Result<TokenPayload, AppError>> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      return ok({ sub: payload.sub, email: payload.email });
    } catch (cause) {
      return err(new UnauthorizedError('Invalid or expired token.', { cause }));
    }
  }
}
