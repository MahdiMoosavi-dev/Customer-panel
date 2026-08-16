import { mapResult, ok, type AppError, type Result } from '@/core';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { ProductDto } from '../dto/product.dto';
import { toProductDto } from '../mappers/product.mapper';

/**
 * Purpose-built capability for other features that need product data
 * without owning a `ProductRepository` themselves — the cart feature uses
 * this to enrich cart items. See docs/04-patterns.md, pattern 14.
 */
export class GetProductsByIdsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(ids: string[]): Promise<Result<ProductDto[], AppError>> {
    if (ids.length === 0) return ok([]);

    const result = await this.productRepository.findByIds(ids);
    return mapResult(result, (products) => products.map(toProductDto));
  }
}
