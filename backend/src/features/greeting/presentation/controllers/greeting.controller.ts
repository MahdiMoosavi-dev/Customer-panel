import { Controller, Get } from '@nestjs/common';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { GreetingDto } from '../../application/dto/greeting.dto';
import { GetGreetingUseCase } from '../../application/use-cases/get-greeting.use-case';

/** Transport layer: turns an HTTP request into a use case call and back. */
@Controller('greeting')
export class GreetingController {
  constructor(private readonly getGreeting: GetGreetingUseCase) {}

  @Get()
  async findCurrent(): Promise<GreetingDto> {
    const result = await this.getGreeting.execute();

    if (!result.ok) {
      throw toHttpException(result.error);
    }

    return result.value;
  }
}
