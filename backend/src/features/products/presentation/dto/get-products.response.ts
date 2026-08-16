import { ApiProperty } from '@nestjs/swagger';
import type { Paginated } from '@/core';
import type { ProductDto } from '../../application/dto/product.dto';
import { ProductResponse } from './product.response';

/** Documentation-only counterpart to `Paginated<ProductDto>`. */
export class PaginatedProductsResponse implements Paginated<ProductDto> {
  @ApiProperty({ type: ProductResponse, isArray: true })
  items!: ProductDto[];

  @ApiProperty({
    example: 42,
    description: 'Total products matching the query, across all pages.',
  })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
