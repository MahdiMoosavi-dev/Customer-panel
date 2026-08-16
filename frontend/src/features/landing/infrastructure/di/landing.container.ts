import {
  makeGetGreeting,
  type GetGreeting,
} from "../../application/use-cases/get-greeting.use-case";
import { createStaticGreetingRepository } from "../repositories/static-greeting.repository";

export interface LandingContainer {
  readonly getGreeting: GetGreeting;
}

/**
 * Composition root for the landing feature: the only file that knows which
 * concrete adapters back the use cases.
 */
export function createLandingContainer(): LandingContainer {
  const greetingRepository = createStaticGreetingRepository();

  return {
    getGreeting: makeGetGreeting({ greetingRepository }),
  };
}

export const landingContainer = createLandingContainer();
