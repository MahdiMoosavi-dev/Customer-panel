import type { Product } from '../../domain/entities/product';
import type { ProductDto } from '../dto/product.dto';

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    title: product.title,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    imageUrl: product.imageUrl,
    price: product.price,
    category: product.category,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
