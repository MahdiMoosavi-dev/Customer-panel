import type { ProductDto } from '@/features/products';
import type { CartItem } from '../../domain/entities/cart-item';
import type { CartItemDto } from '../dto/cart-item.dto';

/**
 * Combines a cart line item with the product data fetched through the
 * products feature's public API (never a repository or Prisma model) — see
 * docs/04-patterns.md, pattern 14.
 */
export function toCartItemDto(
  item: CartItem,
  product: ProductDto,
): CartItemDto {
  return {
    productId: item.productId,
    title: product.title,
    shortDescription: product.shortDescription,
    imageUrl: product.imageUrl,
    price: product.price,
    quantity: item.quantity,
    addedAt: item.createdAt.toISOString(),
  };
}
