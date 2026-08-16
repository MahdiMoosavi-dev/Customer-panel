import { Module } from '@nestjs/common';
import {
  GetProductByIdUseCase,
  GetProductsByIdsUseCase,
  ProductsModule,
} from '@/features/products';
import {
  CART_REPOSITORY,
  type CartRepository,
} from '../domain/repositories/cart.repository';
import { AddCartItemUseCase } from '../application/use-cases/add-cart-item.use-case';
import { GetCartUseCase } from '../application/use-cases/get-cart.use-case';
import { RemoveCartItemUseCase } from '../application/use-cases/remove-cart-item.use-case';
import { CartController } from '../presentation/controllers/cart.controller';
import { PrismaCartRepository } from './repositories/prisma-cart.repository';

/**
 * Composition root for the cart feature. Imports `ProductsModule` to reuse
 * its exported use cases instead of a `ProductRepository` of its own — the
 * same cross-feature-dependency shape `AuthModule` uses for `UsersModule`.
 */
@Module({
  imports: [ProductsModule],
  controllers: [CartController],
  providers: [
    PrismaCartRepository,
    { provide: CART_REPOSITORY, useExisting: PrismaCartRepository },
    {
      provide: GetCartUseCase,
      useFactory: (
        repo: CartRepository,
        getProductsByIds: GetProductsByIdsUseCase,
      ) => new GetCartUseCase(repo, getProductsByIds),
      inject: [CART_REPOSITORY, GetProductsByIdsUseCase],
    },
    {
      provide: AddCartItemUseCase,
      useFactory: (
        repo: CartRepository,
        getProductById: GetProductByIdUseCase,
      ) => new AddCartItemUseCase(repo, getProductById),
      inject: [CART_REPOSITORY, GetProductByIdUseCase],
    },
    {
      provide: RemoveCartItemUseCase,
      useFactory: (repo: CartRepository) => new RemoveCartItemUseCase(repo),
      inject: [CART_REPOSITORY],
    },
  ],
})
export class CartModule {}
