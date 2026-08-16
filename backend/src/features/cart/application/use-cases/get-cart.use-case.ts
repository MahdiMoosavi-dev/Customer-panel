import type { AppError, Result } from '@/core';
import type { GetProductsByIdsUseCase } from '@/features/products';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { CartItemDto } from '../dto/cart-item.dto';
import { toCartItemDto } from '../mappers/cart-item.mapper';

export class GetCartUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly getProductsByIds: GetProductsByIdsUseCase,
  ) {}

  async execute(userId: string): Promise<Result<CartItemDto[], AppError>> {
    const itemsResult = await this.cartRepository.findByUser(userId);
    if (!itemsResult.ok) return itemsResult;

    const productIds = itemsResult.value.map((item) => item.productId);
    const productsResult = await this.getProductsByIds.execute(productIds);
    if (!productsResult.ok) return productsResult;

    const productsById = new Map(
      productsResult.value.map((product) => [product.id, product]),
    );

    const items = itemsResult.value.flatMap((item) => {
      const product = productsById.get(item.productId);
      // Cascade delete keeps this in sync, but skip defensively rather than
      // crash if a cart row is ever found without its product.
      return product ? [toCartItemDto(item, product)] : [];
    });

    return { ok: true, value: items };
  }
}
