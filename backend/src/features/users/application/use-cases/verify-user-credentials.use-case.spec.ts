import {
  NotFoundError,
  UnexpectedError,
  type AppError,
  type Result,
} from '@/core';
import type { User } from '../../domain/entities/user';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { VerifyUserCredentialsUseCase } from './verify-user-credentials.use-case';

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
  findByEmail: UserRepository['findByEmail'],
): UserRepository {
  return {
    create: () => Promise.reject(new Error('not used')),
    findAll: () => Promise.reject(new Error('not used')),
    findById: () => Promise.reject(new Error('not used')),
    update: () => Promise.reject(new Error('not used')),
    remove: () => Promise.reject(new Error('not used')),
    findByEmail,
  };
}

function fakeHasher(matches: boolean): PasswordHasher {
  return {
    hash: (plain: string) => Promise.resolve(`hashed:${plain}`),
    compare: () => Promise.resolve(matches),
  };
}

describe('VerifyUserCredentialsUseCase', () => {
  it('returns the user on a matching password', async () => {
    const repository = fakeRepository(() =>
      Promise.resolve({ ok: true, value: fakeUser() }),
    );
    const useCase = new VerifyUserCredentialsUseCase(
      repository,
      fakeHasher(true),
    );

    const result = await useCase.execute({
      email: 'ada@example.com',
      password: 's3cret!!',
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: 'user-1',
        email: 'ada@example.com',
      }) as unknown,
    });
  });

  it('reports unauthorized, not not-found, when the email does not exist', async () => {
    const repository = fakeRepository(() =>
      Promise.resolve({
        ok: false,
        error: new NotFoundError('User not found.'),
      }),
    );
    const useCase = new VerifyUserCredentialsUseCase(
      repository,
      fakeHasher(false),
    );

    const result = await useCase.execute({
      email: 'nobody@example.com',
      password: 'x',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('reports unauthorized when the password does not match', async () => {
    const repository = fakeRepository(() =>
      Promise.resolve({ ok: true, value: fakeUser() }),
    );
    const useCase = new VerifyUserCredentialsUseCase(
      repository,
      fakeHasher(false),
    );

    const result = await useCase.execute({
      email: 'ada@example.com',
      password: 'wrong',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('passes unrelated repository failures through untouched', async () => {
    const failure: Result<User, AppError> = {
      ok: false,
      error: new UnexpectedError('db down'),
    };
    const repository = fakeRepository(() => Promise.resolve(failure));
    const useCase = new VerifyUserCredentialsUseCase(
      repository,
      fakeHasher(false),
    );

    const result = await useCase.execute({
      email: 'ada@example.com',
      password: 'x',
    });

    expect(result).toEqual(failure);
  });
});
