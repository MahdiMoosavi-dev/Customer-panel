export type SortOrder = 'asc' | 'desc';

/**
 * One page of results, returned by any repository that paginates a list.
 * Framework-free so it can travel through domain, application, and — via a
 * mirrored `presentation/dto/*.response.ts` class (see docs/04-patterns.md,
 * pattern 18) — the HTTP layer.
 */
export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
