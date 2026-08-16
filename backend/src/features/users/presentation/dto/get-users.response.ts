import { ApiProperty } from '@nestjs/swagger';
import type { Paginated } from '@/core';
import type { UserDto } from '../../application/dto/user.dto';
import { UserResponse } from './user.response';

/** Documentation-only counterpart to `Paginated<UserDto>`. */
export class PaginatedUsersResponse implements Paginated<UserDto> {
  @ApiProperty({ type: UserResponse, isArray: true })
  items!: UserDto[];

  @ApiProperty({
    example: 42,
    description: 'Total users matching the query, across all pages.',
  })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
