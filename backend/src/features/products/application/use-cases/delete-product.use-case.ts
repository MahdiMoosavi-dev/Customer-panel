import type { AppError, Result } from '@/core';
import type { ProductRepository } from '../../domain/repositories/product.repository';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  execute(id: string): Promise<Result<void, AppError>> {
    return this.productRepository.remove(id);
  }
}
