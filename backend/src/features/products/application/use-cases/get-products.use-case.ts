import { mapResult, type AppError, type Paginated, type Result } from '@/core';
import type {
  ProductListQuery,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import type { GetProductsQueryDto } from '../dto/get-products-query.dto';
import type { ProductDto } from '../dto/product.dto';
import { toProductDto } from '../mappers/product.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'asc';

function normalizePositiveInt(
  value: number | undefined,
  fallback: number,
): number {
  return value !== undefined && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    query: GetProductsQueryDto = {},
  ): Promise<Result<Paginated<ProductDto>, AppError>> {
    const listQuery: ProductListQuery = {
      page: normalizePositiveInt(query.page, DEFAULT_PAGE),
      pageSize: Math.min(
        normalizePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      ),
      search: query.search?.trim() || undefined,
      sortBy: query.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: query.sortOrder ?? DEFAULT_SORT_ORDER,
    };

    const result = await this.productRepository.findAll(listQuery);
    return mapResult(result, (page) => ({
      ...page,
      items: page.items.map(toProductDto),
    }));
  }
}
