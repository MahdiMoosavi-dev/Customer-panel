import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { env } from '@/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(env.apiPrefix);
  app.enableCors({ origin: env.corsOrigin });

  await app.listen(env.port);

  Logger.log(
    `Listening on http://localhost:${env.port}/${env.apiPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
