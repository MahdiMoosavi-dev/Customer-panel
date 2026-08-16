import type { SortOrder } from '@/core';
import type { ProductSortField } from '../../domain/repositories/product.repository';

/** Framework-free shape of the list query. */
export interface GetProductsQueryDto {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: ProductSortField;
  readonly sortOrder?: SortOrder;
}
