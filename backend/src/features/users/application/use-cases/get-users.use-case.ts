import { mapResult, type AppError, type Result } from '@/core';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

export class GetUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<Result<UserDto[], AppError>> {
    const result = await this.userRepository.findAll();
    return mapResult(result, (users) => users.map(toUserDto));
  }
}
