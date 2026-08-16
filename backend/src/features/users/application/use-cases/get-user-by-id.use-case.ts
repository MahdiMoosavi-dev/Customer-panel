import { mapResult, type AppError, type Result } from '@/core';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<Result<UserDto, AppError>> {
    const result = await this.userRepository.findById(id);
    return mapResult(result, toUserDto);
  }
}
