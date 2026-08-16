import type { AppError, Result } from '@/core';
import type { NewUser, User } from '../entities/user';

export interface UserChanges {
  readonly email?: string;
  readonly name?: string;
  readonly passwordHash?: string;
}

/**
 * Port owned by the domain. The infrastructure layer supplies the Prisma
 * adapter, so swapping the database never touches inner layers.
 */
export interface UserRepository {
  create(user: NewUser): Promise<Result<User, AppError>>;
  findAll(): Promise<Result<User[], AppError>>;
  findById(id: string): Promise<Result<User, AppError>>;
  findByEmail(email: string): Promise<Result<User, AppError>>;
  update(id: string, changes: UserChanges): Promise<Result<User, AppError>>;
  remove(id: string): Promise<Result<void, AppError>>;
}

/** DI token, since an interface does not survive compilation. */
export const USER_REPOSITORY = Symbol('UserRepository');
