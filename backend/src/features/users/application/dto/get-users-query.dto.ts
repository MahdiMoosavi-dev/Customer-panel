import type { SortOrder } from '@/core';
import type { UserSortField } from '../../domain/repositories/user.repository';

/** Framework-free shape of the list query — dates travel as ISO strings. */
export interface GetUsersQueryDto {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly sortBy?: UserSortField;
  readonly sortOrder?: SortOrder;
}
