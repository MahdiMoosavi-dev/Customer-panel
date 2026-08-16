import { mapResult, type AppError, type Paginated, type Result } from '@/core';
import type {
  UserListQuery,
  UserRepository,
} from '../../domain/repositories/user.repository';
import type { GetUsersQueryDto } from '../dto/get-users-query.dto';
import type { UserDto } from '../dto/user.dto';
import { toUserDto } from '../mappers/user.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'asc';

function normalizePositiveInt(
  value: number | undefined,
  fallback: number,
): number {
  return value !== undefined && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

export class GetUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    query: GetUsersQueryDto = {},
  ): Promise<Result<Paginated<UserDto>, AppError>> {
    const listQuery: UserListQuery = {
      page: normalizePositiveInt(query.page, DEFAULT_PAGE),
      pageSize: Math.min(
        normalizePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      ),
      search: query.search?.trim() || undefined,
      createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
      createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
      sortBy: query.sortBy ?? DEFAULT_SORT_BY,
      sortOrder: query.sortOrder ?? DEFAULT_SORT_ORDER,
    };

    const result = await this.userRepository.findAll(listQuery);
    return mapResult(result, (page) => ({
      ...page,
      items: page.items.map(toUserDto),
    }));
  }
}
