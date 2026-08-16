import type { AppError, Result } from '@/core';
import type { CartRepository } from '../../domain/repositories/cart.repository';

export class RemoveCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  execute(userId: string, productId: string): Promise<Result<void, AppError>> {
    return this.cartRepository.removeItem(userId, productId);
  }
}
