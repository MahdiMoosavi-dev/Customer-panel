import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from '@/shared/http/api-error-response';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { AuthTokenDto } from '../../application/dto/auth-token.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthTokenResponse } from '../dto/auth-token.response';
import { LoginRequest } from '../dto/login.request';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Exchange email + password for a bearer token.' })
  @ApiResponse({ status: 201, type: AuthTokenResponse })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Invalid email or password.',
  })
  async login(@Body() body: LoginRequest): Promise<AuthTokenDto> {
    const result = await this.loginUseCase.execute(body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }
}
