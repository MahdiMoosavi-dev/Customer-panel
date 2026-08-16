import type { AppError, Paginated, Result, SortOrder } from '@/core';
import type { NewProduct, Product } from '../entities/product';

export interface ProductChanges {
  readonly title?: string;
  readonly shortDescription?: string;
  readonly longDescription?: string;
  readonly imageUrl?: string;
  readonly price?: number;
  readonly category?: string;
}

/** Columns a caller may sort the product list by. */
export type ProductSortField = 'title' | 'price' | 'createdAt' | 'updatedAt';

export interface ProductListQuery {
  readonly page: number;
  readonly pageSize: number;
  /** Case-insensitive match against title. */
  readonly search?: string;
  readonly sortBy: ProductSortField;
  readonly sortOrder: SortOrder;
}

/**
 * Port owned by the domain. The infrastructure layer supplies the Prisma
 * adapter, so swapping the database never touches inner layers.
 */
export interface ProductRepository {
  create(product: NewProduct): Promise<Result<Product, AppError>>;
  findAll(
    query: ProductListQuery,
  ): Promise<Result<Paginated<Product>, AppError>>;
  findById(id: string): Promise<Result<Product, AppError>>;
  /** Used by the cart feature to enrich cart items — see `GetProductsByIdsUseCase`. */
  findByIds(ids: string[]): Promise<Result<Product[], AppError>>;
  update(
    id: string,
    changes: ProductChanges,
  ): Promise<Result<Product, AppError>>;
  remove(id: string): Promise<Result<void, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
