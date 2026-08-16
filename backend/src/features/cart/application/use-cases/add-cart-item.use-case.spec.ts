import { NotFoundError, type AppError, type Result } from '@/core';
import type { GetProductByIdUseCase, ProductDto } from '@/features/products';
import type { CartItem } from '../../domain/entities/cart-item';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import { AddCartItemUseCase } from './add-cart-item.use-case';

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
    findByUser: () => Promise.resolve({ ok: true, value: [] }),
    addItem: () => Promise.resolve({ ok: true, value: fakeCartItem() }),
    removeItem: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

function fakeGetProductById(
  execute: GetProductByIdUseCase['execute'],
): GetProductByIdUseCase {
  return { execute } as GetProductByIdUseCase;
}

describe('AddCartItemUseCase', () => {
  it('defaults quantity to 1 and adds the item', async () => {
    let receivedQuantity: number | undefined;
    const cartRepository = fakeCartRepository({
      addItem: (_userId, _productId, quantity) => {
        receivedQuantity = quantity;
        return Promise.resolve({
          ok: true,
          value: fakeCartItem({ quantity }),
        });
      },
    });
    const getProductById = fakeGetProductById(() =>
      Promise.resolve({ ok: true, value: fakeProductDto() }),
    );
    const useCase = new AddCartItemUseCase(cartRepository, getProductById);

    const result = await useCase.execute('user-1', { productId: 'product-1' });

    expect(receivedQuantity).toBe(1);
    expect(result).toEqual({
      ok: true,
      value: {
        productId: 'product-1',
        title: 'Ergonomic Office Chair',
        shortDescription: 'A comfortable chair.',
        imageUrl: 'https://example.com/images/chair.jpg',
        price: 249.99,
        quantity: 1,
        addedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('falls back to quantity 1 for a non-positive quantity', async () => {
    let receivedQuantity: number | undefined;
    const cartRepository = fakeCartRepository({
      addItem: (_userId, _productId, quantity) => {
        receivedQuantity = quantity;
        return Promise.resolve({ ok: true, value: fakeCartItem({ quantity }) });
      },
    });
    const getProductById = fakeGetProductById(() =>
      Promise.resolve({ ok: true, value: fakeProductDto() }),
    );
    const useCase = new AddCartItemUseCase(cartRepository, getProductById);

    await useCase.execute('user-1', { productId: 'product-1', quantity: -5 });

    expect(receivedQuantity).toBe(1);
  });

  it('does not touch the cart when the product does not exist', async () => {
    const addItem = jest.fn();
    const cartRepository = fakeCartRepository({ addItem });
    const error: AppError = new NotFoundError('Product not found.');
    const getProductById = fakeGetProductById(() =>
      Promise.resolve({ ok: false, error } as Result<ProductDto, AppError>),
    );
    const useCase = new AddCartItemUseCase(cartRepository, getProductById);

    const result = await useCase.execute('user-1', { productId: 'missing' });

    expect(result).toEqual({ ok: false, error });
    expect(addItem).not.toHaveBeenCalled();
  });
});
