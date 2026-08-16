import type { AppError, Result } from '@/core';
import type { UserRepository } from '../../domain/repositories/user.repository';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(id: string): Promise<Result<void, AppError>> {
    return this.userRepository.remove(id);
  }
}
