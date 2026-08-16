import type { AppError, Result } from '@/core';
import type { NewProduct, Product } from '../../domain/entities/product';
import type {
  ProductChanges,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { CreateProductUseCase } from './create-product.use-case';

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

describe('CreateProductUseCase', () => {
  it('trims text fields and persists a new product', async () => {
    const repository = fakeRepository();
    const useCase = new CreateProductUseCase(repository);

    const result = await useCase.execute({
      title: '  Ergonomic Office Chair  ',
      shortDescription: '  A comfortable chair.  ',
      longDescription: '  Full-grain leather.  ',
      imageUrl: 'https://example.com/images/chair.jpg',
      price: 249.99,
      category: '  Furniture  ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe('Ergonomic Office Chair');
      expect(result.value.category).toBe('Furniture');
    }
  });

  it('rejects a negative price with a validation error', async () => {
    const repository = fakeRepository();
    const useCase = new CreateProductUseCase(repository);

    const result = await useCase.execute({
      title: 'Chair',
      shortDescription: 'Short',
      longDescription: 'Long',
      imageUrl: 'https://example.com/images/chair.jpg',
      price: -1,
      category: 'Furniture',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
