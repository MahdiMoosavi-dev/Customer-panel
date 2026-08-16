import {
  NotFoundError,
  UnauthorizedError,
  type AppError,
  type Result,
} from '@/core';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { CredentialsDto } from '../dto/credentials.dto';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

/**
 * The users feature owns password verification, since it owns the User
 * entity and its password hash. The auth feature depends on this use case
 * — exported through `users/index.ts` — instead of reaching into the
 * repository or the hasher directly.
 */
export class VerifyUserCredentialsUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CredentialsDto): Promise<Result<UserDto, AppError>> {
    const found = await this.userRepository.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (!found.ok) {
      return found.error instanceof NotFoundError
        ? {
            ok: false,
            error: new UnauthorizedError('Invalid email or password.'),
          }
        : found;
    }

    const matches = await this.passwordHasher.compare(
      input.password,
      found.value.passwordHash,
    );
    if (!matches) {
      return {
        ok: false,
        error: new UnauthorizedError('Invalid email or password.'),
      };
    }

    return { ok: true, value: toUserDto(found.value) };
  }
}
