import { Body, Controller, Post } from '@nestjs/common';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { AuthTokenDto } from '../../application/dto/auth-token.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginRequest } from '../dto/login.request';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() body: LoginRequest): Promise<AuthTokenDto> {
    const result = await this.loginUseCase.execute(body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }
}
