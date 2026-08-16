import { NotFoundError, type AppError, type Result } from '@/core';
import type { NewUser, User } from '../../domain/entities/user';
import type {
  UserChanges,
  UserRepository,
} from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { CreateUserUseCase } from './create-user.use-case';

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
    findAll: () => Promise.resolve({ ok: true, value: [] }),
    findById: () =>
      Promise.resolve({
        ok: false,
        error: new NotFoundError('User not found.'),
      }),
    findByEmail: () =>
      Promise.resolve({
        ok: false,
        error: new NotFoundError('User not found.'),
      }),
    update: (_id: string, changes: UserChanges) =>
      Promise.resolve({ ok: true, value: fakeUser(changes) } as Result<
        User,
        AppError
      >),
    remove: () => Promise.resolve({ ok: true, value: undefined }),
    ...overrides,
  };
}

function fakeHasher(): PasswordHasher {
  return {
    hash: (plain: string) => Promise.resolve(`hashed:${plain}`),
    compare: (plain: string, hash: string) =>
      Promise.resolve(hash === `hashed:${plain}`),
  };
}

describe('CreateUserUseCase', () => {
  it('hashes the password and persists a new user', async () => {
    const repository = fakeRepository();
    const useCase = new CreateUserUseCase(repository, fakeHasher());

    const result = await useCase.execute({
      email: ' Ada@Example.com ',
      name: '  Ada Lovelace  ',
      password: 's3cret!!',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'user-1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('rejects a duplicate email with a conflict', async () => {
    const repository = fakeRepository({
      findByEmail: () => Promise.resolve({ ok: true, value: fakeUser() }),
    });
    const useCase = new CreateUserUseCase(repository, fakeHasher());

    const result = await useCase.execute({
      email: 'ada@example.com',
      name: 'Ada',
      password: 's3cret!!',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT');
    }
  });
});
