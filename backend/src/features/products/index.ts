/**
 * Public API of the products feature. `GetProductByIdUseCase` and
 * `GetProductsByIdsUseCase` are exported so the cart feature can validate
 * and enrich cart items without ever seeing a `ProductRepository` — see
 * docs/04-patterns.md, pattern 14.
 */
export { ProductsModule } from './infrastructure/products.module';
export { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
export { GetProductsByIdsUseCase } from './application/use-cases/get-products-by-ids.use-case';
export type { ProductDto } from './application/dto/product.dto';
