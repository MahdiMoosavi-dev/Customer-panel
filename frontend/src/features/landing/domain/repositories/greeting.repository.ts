import type { AppError, Result } from "@/core";
import type { Greeting } from "../entities/greeting";

/**
 * Port owned by the domain. The infrastructure layer supplies the adapter,
 * so swapping a static source for a CMS or API never touches inner layers.
 */
export interface GreetingRepository {
  findCurrent(): Promise<Result<Greeting, AppError>>;
}
