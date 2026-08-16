import { mapResult, type AppError, type Result } from '@/core';
import type { GreetingRepository } from '../../domain/repositories/greeting.repository';
import type { GreetingDto } from '../dto/greeting.dto';
import { toGreetingDto } from '../mappers/greeting.mapper';

/**
 * Plain class with no Nest decorators: dependencies arrive through the
 * constructor, so this is unit-testable with a fake repository and stays
 * portable if the transport layer ever changes.
 */
export class GetGreetingUseCase {
  constructor(private readonly greetingRepository: GreetingRepository) {}

  async execute(): Promise<Result<GreetingDto, AppError>> {
    const result = await this.greetingRepository.findCurrent();
    return mapResult(result, toGreetingDto);
  }
}
