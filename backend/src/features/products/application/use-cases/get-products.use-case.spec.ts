import type { AppError, Result } from '@/core';
import type { NewProduct, Product } from '../../domain/entities/product';
import type {
  ProductChanges,
  ProductListQuery,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { GetProductsUseCase } from './get-products.use-case';

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
        value: { items: [fakeProduct()], total: 1, page: 1, pageSize: 20 },
      }),
    findById: () => Promise.resolve({ ok: true, value: fakeProduct() }),
    findByIds: () => Promise.resolve({ ok: true, value: [] }),
    update: (_id: string, changes: ProductChanges) =>
      Promise.resolve({ ok: true, value: fakeProduct(changes) } as Result<
        Product,
        AppError
      >),
    remove: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

describe('GetProductsUseCase', () => {
  it('applies default paging and sorting when the query is empty', async () => {
    let receivedQuery: ProductListQuery | undefined;
    const repository = fakeRepository({
      findAll: (query) => {
        receivedQuery = query;
        return Promise.resolve({
          ok: true,
          value: { items: [fakeProduct()], total: 1, page: 1, pageSize: 20 },
        });
      },
    });
    const useCase = new GetProductsUseCase(repository);

    await useCase.execute();

    expect(receivedQuery).toEqual({
      page: 1,
      pageSize: 20,
      search: undefined,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });
  });

  it('trims search and caps pageSize at 100', async () => {
    let receivedQuery: ProductListQuery | undefined;
    const repository = fakeRepository({
      findAll: (query) => {
        receivedQuery = query;
        return Promise.resolve({
          ok: true,
          value: { items: [], total: 0, page: 1, pageSize: 100 },
        });
      },
    });
    const useCase = new GetProductsUseCase(repository);

    await useCase.execute({
      pageSize: 500,
      search: '  chair  ',
      sortBy: 'price',
      sortOrder: 'desc',
    });

    expect(receivedQuery).toEqual({
      page: 1,
      pageSize: 100,
      search: 'chair',
      sortBy: 'price',
      sortOrder: 'desc',
    });
  });
});
