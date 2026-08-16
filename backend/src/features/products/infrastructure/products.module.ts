import { Module } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../domain/repositories/product.repository';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case';
import { GetProductByIdUseCase } from '../application/use-cases/get-product-by-id.use-case';
import { GetProductsByIdsUseCase } from '../application/use-cases/get-products-by-ids.use-case';
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { ProductsController } from '../presentation/controllers/products.controller';
import { PrismaProductRepository } from './repositories/prisma-product.repository';

/**
 * Composition root for the products feature. `GetProductByIdUseCase` and
 * `GetProductsByIdsUseCase` are exported so the cart feature can validate
 * and enrich cart items without ever seeing a `ProductRepository` — see
 * docs/04-patterns.md.
 */
@Module({
  controllers: [ProductsController],
  providers: [
    PrismaProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: PrismaProductRepository },
    {
      provide: CreateProductUseCase,
      useFactory: (repo: ProductRepository) => new CreateProductUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductsUseCase,
      useFactory: (repo: ProductRepository) => new GetProductsUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductByIdUseCase,
      useFactory: (repo: ProductRepository) => new GetProductByIdUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductsByIdsUseCase,
      useFactory: (repo: ProductRepository) =>
        new GetProductsByIdsUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: UpdateProductUseCase,
      useFactory: (repo: ProductRepository) => new UpdateProductUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: DeleteProductUseCase,
      useFactory: (repo: ProductRepository) => new DeleteProductUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
  ],
  exports: [GetProductByIdUseCase, GetProductsByIdsUseCase],
})
export class ProductsModule {}
