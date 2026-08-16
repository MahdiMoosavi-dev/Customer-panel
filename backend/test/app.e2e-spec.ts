import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('GreetingController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /greeting returns the current greeting', () => {
    return request(app.getHttpServer())
      .get('/greeting')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toEqual({
          headline: 'Hello World',
          message: expect.stringContaining('up and running') as unknown,
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
