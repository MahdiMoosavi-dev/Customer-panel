import { ValidationError, mapResult, type AppError, type Result } from '@/core';
import type {
  ProductChanges,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import type { ProductDto } from '../dto/product.dto';
import type { UpdateProductDto } from '../dto/update-product.dto';
import { toProductDto } from '../mappers/product.mapper';

export class UpdateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    id: string,
    input: UpdateProductDto,
  ): Promise<Result<ProductDto, AppError>> {
    const changes: {
      -readonly [K in keyof ProductChanges]?: ProductChanges[K];
    } = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length === 0) {
        return {
          ok: false,
          error: new ValidationError('A title is required.'),
        };
      }
      changes.title = title;
    }

    if (input.shortDescription !== undefined) {
      const shortDescription = input.shortDescription.trim();
      if (shortDescription.length === 0) {
        return {
          ok: false,
          error: new ValidationError('A short description is required.'),
        };
      }
      changes.shortDescription = shortDescription;
    }

    if (input.longDescription !== undefined) {
      const longDescription = input.longDescription.trim();
      if (longDescription.length === 0) {
        return {
          ok: false,
          error: new ValidationError('A long description is required.'),
        };
      }
      changes.longDescription = longDescription;
    }

    if (input.imageUrl !== undefined) {
      const imageUrl = input.imageUrl.trim();
      if (imageUrl.length === 0) {
        return {
          ok: false,
          error: new ValidationError('An image URL is required.'),
        };
      }
      changes.imageUrl = imageUrl;
    }

    if (input.price !== undefined) {
      if (!Number.isFinite(input.price) || input.price < 0) {
        return {
          ok: false,
          error: new ValidationError('Price must be a non-negative number.'),
        };
      }
      changes.price = input.price;
    }

    if (input.category !== undefined) {
      const category = input.category.trim();
      if (category.length === 0) {
        return {
          ok: false,
          error: new ValidationError('A category is required.'),
        };
      }
      changes.category = category;
    }

    const updated = await this.productRepository.update(id, changes);
    return mapResult(updated, toProductDto);
  }
}
