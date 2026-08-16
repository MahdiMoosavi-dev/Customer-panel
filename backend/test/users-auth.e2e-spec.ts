import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Users + Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `${randomUUID()}@example.com`;
  const password = 's3cret!!';
  let userId: string;
  let accessToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users creates a user and never returns the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Ada Lovelace', password })
      .expect(201);

    const body = response.body as { id: string; passwordHash?: string };
    expect(response.body).toMatchObject({ email, name: 'Ada Lovelace' });
    expect(body.passwordHash).toBeUndefined();
    userId = body.id;
  });

  it('POST /users rejects a duplicate email with 409', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Someone Else', password })
      .expect(409);
  });

  it('POST /users rejects a weak password with 400', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: `${randomUUID()}@example.com`,
        name: 'Weak',
        password: 'short',
      })
      .expect(400);
  });

  it('GET /users requires a bearer token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('POST /auth/login rejects the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('POST /auth/login issues a bearer token for correct credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const body = response.body as { accessToken: string };
    expect(typeof body.accessToken).toBe('string');
    accessToken = body.accessToken;
  });

  it('GET /users succeeds with a valid bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: userId, email })]),
    );
  });

  it('GET /users/:id succeeds with a valid bearer token', async () => {
    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('GET /users rejects a garbage bearer token', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('DELETE /users/:id removes the user', async () => {
    await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
