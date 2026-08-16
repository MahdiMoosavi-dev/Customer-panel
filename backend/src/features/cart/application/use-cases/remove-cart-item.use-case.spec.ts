import { NotFoundError } from '@/core';
import type { CartItem } from '../../domain/entities/cart-item';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import { RemoveCartItemUseCase } from './remove-cart-item.use-case';

function fakeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'cart-item-1',
    userId: 'user-1',
    productId: 'product-1',
    quantity: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeCartRepository(
  overrides: Partial<CartRepository> = {},
): CartRepository {
  return {
    findByUser: () => Promise.resolve({ ok: true, value: [fakeCartItem()] }),
    addItem: () => Promise.resolve({ ok: true, value: fakeCartItem() }),
    removeItem: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

describe('RemoveCartItemUseCase', () => {
  it('delegates removal to the repository', async () => {
    let receivedArgs: [string, string] | undefined;
    const repository = fakeCartRepository({
      removeItem: (userId, productId) => {
        receivedArgs = [userId, productId];
        return Promise.resolve({ ok: true, value: undefined });
      },
    });
    const useCase = new RemoveCartItemUseCase(repository);

    const result = await useCase.execute('user-1', 'product-1');

    expect(receivedArgs).toEqual(['user-1', 'product-1']);
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('passes a not-found failure through untouched', async () => {
    const error = new NotFoundError('Product not found in cart.');
    const repository = fakeCartRepository({
      removeItem: () => Promise.resolve({ ok: false, error }),
    });
    const useCase = new RemoveCartItemUseCase(repository);

    const result = await useCase.execute('user-1', 'product-1');

    expect(result).toEqual({ ok: false, error });
  });
});
