import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { GetProductsQueryDto } from '../../application/dto/get-products-query.dto';

export const PRODUCT_SORT_FIELDS = [
  'title',
  'price',
  'createdAt',
  'updatedAt',
] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Validated query-string params for `GET /products`. Query DTOs are not
 * picked up by `@nestjs/swagger`'s reflection the way `@Body()` DTOs are,
 * so the matching `@ApiQuery()` decorators live on the controller instead —
 * see docs/04-patterns.md, pattern 19.
 */
export class GetProductsRequest implements GetProductsQueryDto {
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
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: (typeof PRODUCT_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}
