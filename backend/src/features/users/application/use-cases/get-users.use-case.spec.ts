import type { AppError, Result } from '@/core';
import type { NewUser, User } from '../../domain/entities/user';
import type {
  UserChanges,
  UserListQuery,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { GetUsersUseCase } from './get-users.use-case';

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    passwordHash: 'hashed:s3cret!!',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeRepository(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    create: (user: NewUser) =>
      Promise.resolve({ ok: true, value: fakeUser(user) } as Result<
        User,
        AppError
      >),
    findAll: () =>
      Promise.resolve({
        ok: true,
        value: { items: [fakeUser()], total: 1, page: 1, pageSize: 20 },
      }),
    findById: () => Promise.resolve({ ok: true, value: fakeUser() }),
    findByEmail: () => Promise.resolve({ ok: true, value: fakeUser() }),
    update: (_id: string, changes: UserChanges) =>
      Promise.resolve({ ok: true, value: fakeUser(changes) } as Result<
        User,
        AppError
      >),
    remove: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

describe('GetUsersUseCase', () => {
  it('applies default paging and sorting when the query is empty', async () => {
    let receivedQuery: UserListQuery | undefined;
    const repository = fakeRepository({
      findAll: (query) => {
        receivedQuery = query;
        return Promise.resolve({
          ok: true,
          value: { items: [fakeUser()], total: 1, page: 1, pageSize: 20 },
        });
      },
    });
    const useCase = new GetUsersUseCase(repository);

    const result = await useCase.execute();

    expect(receivedQuery).toEqual({
      page: 1,
      pageSize: 20,
      search: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        total: 1,
        page: 1,
        pageSize: 20,
        items: [
          {
            id: 'user-1',
            email: 'ada@example.com',
            name: 'Ada Lovelace',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  });

  it('trims search, normalizes dates, and caps pageSize at 100', async () => {
    let receivedQuery: UserListQuery | undefined;
    const repository = fakeRepository({
      findAll: (query) => {
        receivedQuery = query;
        return Promise.resolve({
          ok: true,
          value: { items: [], total: 0, page: 2, pageSize: 100 },
        });
      },
    });
    const useCase = new GetUsersUseCase(repository);

    await useCase.execute({
      page: 2,
      pageSize: 500,
      search: '  ada  ',
      createdFrom: '2026-01-01T00:00:00.000Z',
      createdTo: '2026-02-01T00:00:00.000Z',
      sortBy: 'email',
      sortOrder: 'desc',
    });

    expect(receivedQuery).toEqual({
      page: 2,
      pageSize: 100,
      search: 'ada',
      createdFrom: new Date('2026-01-01T00:00:00.000Z'),
      createdTo: new Date('2026-02-01T00:00:00.000Z'),
      sortBy: 'email',
      sortOrder: 'desc',
    });
  });

  it('passes repository failures through untouched', async () => {
    const error: AppError = { code: 'UNEXPECTED_ERROR' } as AppError;
    const repository = fakeRepository({
      findAll: () => Promise.resolve({ ok: false, error }),
    });
    const useCase = new GetUsersUseCase(repository);

    const result = await useCase.execute();

    expect(result).toEqual({ ok: false, error });
  });
});
