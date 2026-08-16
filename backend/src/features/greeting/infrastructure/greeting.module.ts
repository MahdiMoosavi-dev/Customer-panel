import { Module } from '@nestjs/common';
import { GetGreetingUseCase } from '../application/use-cases/get-greeting.use-case';
import {
  GREETING_REPOSITORY,
  type GreetingRepository,
} from '../domain/repositories/greeting.repository';
import { GreetingController } from '../presentation/controllers/greeting.controller';
import { createStaticGreetingRepository } from './repositories/static-greeting.repository';

/**
 * Composition root for the greeting feature: the only file that knows which
 * concrete adapters back the use cases. Factories keep Nest decorators out
 * of the domain and application layers.
 */
@Module({
  controllers: [GreetingController],
  providers: [
    {
      provide: GREETING_REPOSITORY,
      useFactory: createStaticGreetingRepository,
    },
    {
      provide: GetGreetingUseCase,
      useFactory: (greetingRepository: GreetingRepository) =>
        new GetGreetingUseCase(greetingRepository),
      inject: [GREETING_REPOSITORY],
    },
  ],
})
export class GreetingModule {}
