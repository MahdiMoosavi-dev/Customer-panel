import type { AppError, Paginated, Result, SortOrder } from '@/core';
import type { NewUser, User } from '../entities/user';

export interface UserChanges {
  readonly email?: string;
  readonly name?: string;
  readonly passwordHash?: string;
}

/** Columns a caller may sort the user list by. */
export type UserSortField = 'name' | 'email' | 'createdAt' | 'updatedAt';

export interface UserListQuery {
  readonly page: number;
  readonly pageSize: number;
  /** Case-insensitive match against name or email. */
  readonly search?: string;
  /** Inclusive lower bound on `createdAt`. */
  readonly createdFrom?: Date;
  /** Inclusive upper bound on `createdAt`. */
  readonly createdTo?: Date;
  readonly sortBy: UserSortField;
  readonly sortOrder: SortOrder;
}

/**
 * Port owned by the domain. The infrastructure layer supplies the Prisma
 * adapter, so swapping the database never touches inner layers.
 */
export interface UserRepository {
  create(user: NewUser): Promise<Result<User, AppError>>;
  findAll(query: UserListQuery): Promise<Result<Paginated<User>, AppError>>;
  findById(id: string): Promise<Result<User, AppError>>;
  findByEmail(email: string): Promise<Result<User, AppError>>;
  update(id: string, changes: UserChanges): Promise<Result<User, AppError>>;
  remove(id: string): Promise<Result<void, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const USER_REPOSITORY = Symbol('UserRepository');
