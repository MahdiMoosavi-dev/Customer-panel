import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { GreetingDto } from '../../application/dto/greeting.dto';
import { GetGreetingUseCase } from '../../application/use-cases/get-greeting.use-case';
import { GreetingResponse } from '../dto/greeting.response';

/** Transport layer: turns an HTTP request into a use case call and back. */
@ApiTags('greeting')
@Controller('greeting')
export class GreetingController {
  constructor(private readonly getGreeting: GetGreetingUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get the current greeting.' })
  @ApiResponse({ status: 200, type: GreetingResponse })
  async findCurrent(): Promise<GreetingDto> {
    const result = await this.getGreeting.execute();

    if (!result.ok) {
      throw toHttpException(result.error);
    }

    return result.value;
  }
}
