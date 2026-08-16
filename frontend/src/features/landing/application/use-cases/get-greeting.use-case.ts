import { mapResult, type AppError, type Result } from "@/core";
import type { GreetingRepository } from "../../domain/repositories/greeting.repository";
import type { GreetingDto } from "../dto/greeting.dto";
import { toGreetingDto } from "../mappers/greeting.mapper";

export interface GetGreetingDependencies {
  readonly greetingRepository: GreetingRepository;
}

export type GetGreeting = () => Promise<Result<GreetingDto, AppError>>;

/**
 * Dependencies arrive as arguments rather than imports, so the use case can
 * be tested with a fake repository and knows nothing about how data is stored.
 */
export function makeGetGreeting({
  greetingRepository,
}: GetGreetingDependencies): GetGreeting {
  return async function getGreeting() {
    const result = await greetingRepository.findCurrent();
    return mapResult(result, toGreetingDto);
  };
}
