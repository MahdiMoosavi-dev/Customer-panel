import type { AppError, Result } from '@/core';
import type { NewProduct, Product } from '../../domain/entities/product';
import type {
  ProductChanges,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { GetProductsByIdsUseCase } from './get-products-by-ids.use-case';

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    title: 'Ergonomic Office Chair',
    shortDescription: 'A comfortable chair for long work sessions.',
    longDescription: 'Full-grain leather, adjustable lumbar support.',
    imageUrl: 'https://example.com/images/chair.jpg',
    price: 249.99,
    category: 'Furniture',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeRepository(
  overrides: Partial<ProductRepository> = {},
): ProductRepository {
  return {
    create: (product: NewProduct) =>
      Promise.resolve({ ok: true, value: fakeProduct(product) } as Result<
        Product,
        AppError
      >),
    findAll: () =>
      Promise.resolve({
        ok: true,
        value: { items: [], total: 0, page: 1, pageSize: 20 },
      }),
    findById: () => Promise.resolve({ ok: true, value: fakeProduct() }),
    findByIds: () => Promise.resolve({ ok: true, value: [fakeProduct()] }),
    update: (_id: string, changes: ProductChanges) =>
      Promise.resolve({ ok: true, value: fakeProduct(changes) } as Result<
        Product,
        AppError
      >),
    remove: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

describe('GetProductsByIdsUseCase', () => {
  it('short-circuits with an empty result for an empty id list, without calling the repository', async () => {
    const findByIds = jest.fn();
    const repository = fakeRepository({ findByIds });
    const useCase = new GetProductsByIdsUseCase(repository);

    const result = await useCase.execute([]);

    expect(result).toEqual({ ok: true, value: [] });
    expect(findByIds).not.toHaveBeenCalled();
  });

  it('maps found products to DTOs', async () => {
    const repository = fakeRepository();
    const useCase = new GetProductsByIdsUseCase(repository);

    const result = await useCase.execute(['product-1']);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        expect.objectContaining({
          id: 'product-1',
          title: 'Ergonomic Office Chair',
        }),
      ]);
    }
  });
});
