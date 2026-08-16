import type { AppError, Result, TokenService } from '@/core';
import type { VerifyUserCredentialsUseCase } from '@/features/users';
import type { AuthTokenDto } from '../dto/auth-token.dto';
import type { LoginDto } from '../dto/login.dto';

/**
 * Depends on the users feature's public `VerifyUserCredentialsUseCase`
 * rather than a repository or password hasher of its own — auth never
 * needs to know how a user is verified, only that it can ask.
 */
export class LoginUseCase {
  constructor(
    private readonly verifyUserCredentials: VerifyUserCredentialsUseCase,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginDto): Promise<Result<AuthTokenDto, AppError>> {
    const verification = await this.verifyUserCredentials.execute(input);
    if (!verification.ok) return verification;

    const accessToken = await this.tokenService.sign({
      sub: verification.value.id,
      email: verification.value.email,
    });

    return { ok: true, value: { accessToken } };
  }
}
