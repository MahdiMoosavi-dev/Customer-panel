import { ConflictError, mapResult, type AppError, type Result } from '@/core';
import type {
  UserChanges,
  UserRepository,
} from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    id: string,
    input: UpdateUserDto,
  ): Promise<Result<UserDto, AppError>> {
    const changes: { -readonly [K in keyof UserChanges]?: UserChanges[K] } = {};

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      const existing = await this.userRepository.findByEmail(email);
      if (existing.ok && existing.value.id !== id) {
        return {
          ok: false,
          error: new ConflictError('A user with this email already exists.'),
        };
      }
      changes.email = email;
    }

    if (input.name !== undefined) {
      changes.name = input.name.trim();
    }

    if (input.password !== undefined) {
      changes.passwordHash = await this.passwordHasher.hash(input.password);
    }

    const updated = await this.userRepository.update(id, changes);
    return mapResult(updated, toUserDto);
  }
}
