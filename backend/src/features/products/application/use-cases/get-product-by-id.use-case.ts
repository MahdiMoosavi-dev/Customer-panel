import { mapResult, type AppError, type Result } from '@/core';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { ProductDto } from '../dto/product.dto';
import { toProductDto } from '../mappers/product.mapper';

export class GetProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<Result<ProductDto, AppError>> {
    const result = await this.productRepository.findById(id);
    return mapResult(result, toProductDto);
  }
}
