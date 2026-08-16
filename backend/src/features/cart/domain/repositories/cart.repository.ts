import type { AppError, Result } from '@/core';
import type { CartItem } from '../entities/cart-item';

/**
 * Port owned by the domain. The infrastructure layer supplies the Prisma
 * adapter, so swapping the database never touches inner layers.
 */
export interface CartRepository {
  findByUser(userId: string): Promise<Result<CartItem[], AppError>>;
  /** Adds the product, or increments its quantity if already present. */
  addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Result<CartItem, AppError>>;
  removeItem(
    userId: string,
    productId: string,
  ): Promise<Result<void, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const CART_REPOSITORY = Symbol('CartRepository');
