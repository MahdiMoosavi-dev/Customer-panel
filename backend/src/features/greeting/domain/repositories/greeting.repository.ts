import type { AppError, Result } from '@/core';
import type { Greeting } from '../entities/greeting';

/**
 * Port owned by the domain. The infrastructure layer supplies the adapter,
 * so swapping static content for a database never touches inner layers.
 */
export interface GreetingRepository {
  findCurrent(): Promise<Result<Greeting, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const GREETING_REPOSITORY = Symbol('GreetingRepository');
