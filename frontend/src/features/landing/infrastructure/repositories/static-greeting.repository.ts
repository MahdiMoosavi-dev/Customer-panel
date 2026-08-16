import { env, err, UnexpectedError, type AppError, type Result } from "@/core";
import {
  createGreeting,
  type Greeting,
} from "../../domain/entities/greeting";
import type { GreetingRepository } from "../../domain/repositories/greeting.repository";

/**
 * Adapter backed by static content. Replace it with an HTTP or database
 * implementation of `GreetingRepository` and nothing else has to change.
 */
export function createStaticGreetingRepository(): GreetingRepository {
  return {
    async findCurrent(): Promise<Result<Greeting, AppError>> {
      const result = createGreeting({
        headline: "Hello World",
        message: `${env.appName} is up and running.`,
      });

      if (!result.ok) {
        return err(
          new UnexpectedError("The static greeting content is invalid.", {
            cause: result.error,
          }),
        );
      }

      return result;
    },
  };
}
