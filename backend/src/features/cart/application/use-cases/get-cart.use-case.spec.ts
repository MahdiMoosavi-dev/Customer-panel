import type { AppError, Result } from '@/core';
import type { GetProductsByIdsUseCase, ProductDto } from '@/features/products';
import type { CartItem } from '../../domain/entities/cart-item';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import { GetCartUseCase } from './get-cart.use-case';

function fakeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'cart-item-1',
    userId: 'user-1',
    productId: 'product-1',
    quantity: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeProductDto(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'product-1',
    title: 'Ergonomic Office Chair',
    shortDescription: 'A comfortable chair.',
    longDescription: 'Full-grain leather.',
    imageUrl: 'https://example.com/images/chair.jpg',
    price: 249.99,
    category: 'Furniture',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
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

function fakeGetProductsByIds(
  execute: GetProductsByIdsUseCase['execute'],
): GetProductsByIdsUseCase {
  return { execute } as GetProductsByIdsUseCase;
}

describe('GetCartUseCase', () => {
  it('enriches cart items with product details', async () => {
    const cartRepository = fakeCartRepository();
    const getProductsByIds = fakeGetProductsByIds((ids) =>
      Promise.resolve({
        ok: true,
        value: ids.map((id) => fakeProductDto({ id })),
      } as Result<ProductDto[], AppError>),
    );
    const useCase = new GetCartUseCase(cartRepository, getProductsByIds);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      ok: true,
      value: [
        {
          productId: 'product-1',
          title: 'Ergonomic Office Chair',
          shortDescription: 'A comfortable chair.',
          imageUrl: 'https://example.com/images/chair.jpg',
          price: 249.99,
          quantity: 2,
          addedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('skips a cart item whose product could not be found', async () => {
    const cartRepository = fakeCartRepository();
    const getProductsByIds = fakeGetProductsByIds(() =>
      Promise.resolve({ ok: true, value: [] }),
    );
    const useCase = new GetCartUseCase(cartRepository, getProductsByIds);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ ok: true, value: [] });
  });

  it('passes repository failures through untouched', async () => {
    const error: AppError = { code: 'UNEXPECTED_ERROR' } as AppError;
    const cartRepository = fakeCartRepository({
      findByUser: () => Promise.resolve({ ok: false, error }),
    });
    const getProductsByIds = fakeGetProductsByIds(() =>
      Promise.resolve({ ok: true, value: [] }),
    );
    const useCase = new GetCartUseCase(cartRepository, getProductsByIds);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({ ok: false, error });
  });
});
