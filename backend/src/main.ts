import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { env } from '@/core';

const SWAGGER_PATH = 'docs';
const BEARER_AUTH_SCHEME = 'access-token';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(env.apiPrefix);
  app.enableCors({ origin: env.corsOrigin });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${env.appName} API`)
    .setDescription('OpenAPI reference for the Customer Panel backend.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      BEARER_AUTH_SCHEME,
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument);

  await app.listen(env.port);

  Logger.log(
    `Listening on http://localhost:${env.port}/${env.apiPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `Swagger docs at http://localhost:${env.port}/${SWAGGER_PATH}`,
    'Bootstrap',
  );
}

void bootstrap();
