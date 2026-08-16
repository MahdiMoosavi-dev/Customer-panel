import { ApiProperty } from '@nestjs/swagger';

/**
 * The body `toHttpException` always produces. Documented once here and
 * referenced from every controller's `@ApiResponse`, instead of redefining
 * the same three fields per endpoint.
 */
export class ApiErrorResponse {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'User not found.' })
  message!: string;
}
