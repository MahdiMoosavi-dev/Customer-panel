import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { GetUsersQueryDto } from '../../application/dto/get-users-query.dto';

export const USER_SORT_FIELDS = [
  'name',
  'email',
  'createdAt',
  'updatedAt',
] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Validated query-string params for `GET /users`. Query DTOs are not picked
 * up by `@nestjs/swagger`'s reflection the way `@Body()` DTOs are, so the
 * matching `@ApiQuery()` decorators live on the controller instead — see
 * docs/04-patterns.md, pattern 16.
 */
export class GetUsersRequest implements GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsISO8601()
  createdFrom?: string;

  @IsOptional()
  @IsISO8601()
  createdTo?: string;

  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy?: (typeof USER_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}
