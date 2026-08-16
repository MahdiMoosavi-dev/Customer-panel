import { ApiProperty } from '@nestjs/swagger';
import type { GreetingDto } from '../../application/dto/greeting.dto';

/**
 * Documentation-only counterpart to `GreetingDto`. The application DTO
 * stays a plain interface; this class exists so Swagger has a runtime
 * shape to introspect — the same reason request DTOs exist for bodies.
 */
export class GreetingResponse implements GreetingDto {
  @ApiProperty({ example: 'Hello World' })
  headline!: string;

  @ApiProperty({ example: 'Customer Panel API is up and running.' })
  message!: string;
}
