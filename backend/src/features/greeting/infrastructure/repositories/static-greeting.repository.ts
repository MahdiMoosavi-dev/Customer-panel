import { env, err, UnexpectedError, type AppError, type Result } from '@/core';
import { createGreeting, type Greeting } from '../../domain/entities/greeting';
import type { GreetingRepository } from '../../domain/repositories/greeting.repository';

/**
 * Adapter backed by static content. Replace it with a database or upstream
 * API implementation of `GreetingRepository` and nothing else has to change.
 */
export function createStaticGreetingRepository(): GreetingRepository {
  return {
    findCurrent(): Promise<Result<Greeting, AppError>> {
      const result = createGreeting({
        headline: 'Hello World',
        message: `${env.appName} API is up and running.`,
      });

      if (!result.ok) {
        return Promise.resolve(
          err(
            new UnexpectedError('The static greeting content is invalid.', {
              cause: result.error,
            }),
          ),
        );
      }

      return Promise.resolve(result);
    },
  };
}
