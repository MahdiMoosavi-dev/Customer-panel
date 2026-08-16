import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Products + Cart (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const uniqueTitle = `Test Chair ${randomUUID()}`;
  const newProduct = {
    title: uniqueTitle,
    shortDescription: 'A comfortable chair for long work sessions.',
    longDescription: 'Full-grain leather, adjustable lumbar support.',
    imageUrl: 'https://example.com/images/chair.jpg',
    price: 249.99,
    category: 'Furniture',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const email = `${randomUUID()}@example.com`;
    const password = 's3cret!!';
    await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Product Tester', password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = (login.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('products', () => {
    let productId: string;

    it('POST /products requires a bearer token', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send(newProduct)
        .expect(401);
    });

    it('POST /products creates a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newProduct)
        .expect(201);

      const body = response.body as { id: string; title: string };
      expect(body).toMatchObject({ title: uniqueTitle, price: 249.99 });
      productId = body.id;
    });

    it('POST /products rejects an invalid image URL with 400', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...newProduct, imageUrl: 'not-a-url' })
        .expect(400);
    });

    it('GET /products lists products without a bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ search: uniqueTitle })
        .expect(200);

      const body = response.body as { items: { id: string }[]; total: number };
      expect(body.items).toEqual([expect.objectContaining({ id: productId })]);
      expect(body.total).toBe(1);
    });

    it('GET /products/:id returns the product without a bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: productId,
        title: uniqueTitle,
      });
    });

    it('GET /products/:id 404s for a missing product', async () => {
      await request(app.getHttpServer())
        .get(`/products/${randomUUID()}`)
        .expect(404);
    });

    it('PATCH /products/:id requires a bearer token', async () => {
      await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .send({ price: 199.99 })
        .expect(401);
    });

    it('PATCH /products/:id updates the product', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 199.99 })
        .expect(200);

      expect(response.body).toMatchObject({ id: productId, price: 199.99 });
    });

    afterAll(async () => {
      if (productId) {
        await request(app.getHttpServer())
          .delete(`/products/${productId}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });

  describe('cart', () => {
    let productId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...newProduct, title: `Cart Test Product ${randomUUID()}` })
        .expect(201);
      productId = (response.body as { id: string }).id;
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('GET /cart requires a bearer token', async () => {
      await request(app.getHttpServer()).get('/cart').expect(401);
    });

    it('POST /cart/items 404s for a missing product', async () => {
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: randomUUID() })
        .expect(404);
    });

    it('POST /cart/items adds a product with a default quantity of 1', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId })
        .expect(201);

      expect(response.body).toMatchObject({ productId, quantity: 1 });
    });

    it('POST /cart/items increments quantity when the product is already in the cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId, quantity: 3 })
        .expect(201);

      expect(response.body).toMatchObject({ productId, quantity: 4 });
    });

    it("GET /cart returns the current user's cart, enriched with product details", async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { productId: string; quantity: number }[];
      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId, quantity: 4 }),
        ]),
      );
    });

    it('DELETE /cart/items/:productId requires a bearer token', async () => {
      await request(app.getHttpServer())
        .delete(`/cart/items/${productId}`)
        .expect(401);
    });

    it('DELETE /cart/items/:productId removes the product from the cart', async () => {
      await request(app.getHttpServer())
        .delete(`/cart/items/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('DELETE /cart/items/:productId 404s when the product is not in the cart', async () => {
      await request(app.getHttpServer())
        .delete(`/cart/items/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('deleting a product removes it from the cart (cascade)', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...newProduct, title: `Cascade Test Product ${randomUUID()}` })
        .expect(201);
      const cascadeProductId = (response.body as { id: string }).id;

      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: cascadeProductId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/products/${cascadeProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const cart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = cart.body as { productId: string }[];
      expect(body.some((item) => item.productId === cascadeProductId)).toBe(
        false,
      );
    });
  });
});
