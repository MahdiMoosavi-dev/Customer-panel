import { mapResult, type AppError, type Result } from '@/core';
import { createProduct } from '../../domain/entities/product';
import type { ProductRepository } from '../../domain/repositories/product.repository';
import type { CreateProductDto } from '../dto/create-product.dto';
import type { ProductDto } from '../dto/product.dto';
import { toProductDto } from '../mappers/product.mapper';

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    input: CreateProductDto,
  ): Promise<Result<ProductDto, AppError>> {
    const draft = createProduct(input);
    if (!draft.ok) return draft;

    const created = await this.productRepository.create(draft.value);
    return mapResult(created, toProductDto);
  }
}
