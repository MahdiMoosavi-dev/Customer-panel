import { mapResult, type AppError, type Result } from '@/core';
import type { GetProductByIdUseCase } from '@/features/products';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { AddCartItemDto } from '../dto/add-cart-item.dto';
import type { CartItemDto } from '../dto/cart-item.dto';
import { toCartItemDto } from '../mappers/cart-item.mapper';

const DEFAULT_QUANTITY = 1;

function normalizeQuantity(value: number | undefined): number {
  return value !== undefined && Number.isInteger(value) && value > 0
    ? value
    : DEFAULT_QUANTITY;
}

/**
 * Depends on the products feature's `GetProductByIdUseCase` — never a
 * `ProductRepository` — to confirm the product exists before adding it, the
 * same cross-feature-capability pattern `auth` uses for `users`.
 */
export class AddCartItemUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly getProductById: GetProductByIdUseCase,
  ) {}

  async execute(
    userId: string,
    input: AddCartItemDto,
  ): Promise<Result<CartItemDto, AppError>> {
    const product = await this.getProductById.execute(input.productId);
    if (!product.ok) return product;

    const quantity = normalizeQuantity(input.quantity);
    const added = await this.cartRepository.addItem(
      userId,
      input.productId,
      quantity,
    );

    return mapResult(added, (item) => toCartItemDto(item, product.value));
  }
}
