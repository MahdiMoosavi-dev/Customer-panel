import { ConflictError, mapResult, type AppError, type Result } from '@/core';
import { createUser } from '../../domain/entities/user';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserDto): Promise<Result<UserDto, AppError>> {
    const existing = await this.userRepository.findByEmail(
      input.email.trim().toLowerCase(),
    );
    if (existing.ok) {
      return {
        ok: false,
        error: new ConflictError('A user with this email already exists.'),
      };
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const draft = createUser({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    if (!draft.ok) return draft;

    const created = await this.userRepository.create(draft.value);
    return mapResult(created, toUserDto);
  }
}
