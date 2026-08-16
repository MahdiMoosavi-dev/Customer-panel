import { Injectable } from '@nestjs/common';
import { Prisma, type User as PrismaUser } from '@prisma/client';
import {
  ConflictError,
  err,
  NotFoundError,
  ok,
  UnexpectedError,
  type AppError,
  type Result,
} from '@/core';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { NewUser, User } from '../../domain/entities/user';
import type {
  UserChanges,
  UserRepository,
} from '../../domain/repositories/user.repository';

function isKnownRequestError(
  cause: unknown,
  code: string,
): cause is Prisma.PrismaClientKnownRequestError {
  return (
    cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === code
  );
}

function toUser(record: PrismaUser): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    passwordHash: record.passwordHash,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: NewUser): Promise<Result<User, AppError>> {
    try {
      const record = await this.prisma.user.create({ data: user });
      return ok(toUser(record));
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2002')) {
        return err(
          new ConflictError('A user with this email already exists.', {
            cause,
          }),
        );
      }
      return err(new UnexpectedError('Could not create the user.', { cause }));
    }
  }

  async findAll(): Promise<Result<User[], AppError>> {
    try {
      const records = await this.prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return ok(records.map(toUser));
    } catch (cause) {
      return err(new UnexpectedError('Could not list users.', { cause }));
    }
  }

  async findById(id: string): Promise<Result<User, AppError>> {
    try {
      const record = await this.prisma.user.findUnique({ where: { id } });
      return record
        ? ok(toUser(record))
        : err(new NotFoundError('User not found.'));
    } catch (cause) {
      return err(new UnexpectedError('Could not load the user.', { cause }));
    }
  }

  async findByEmail(email: string): Promise<Result<User, AppError>> {
    try {
      const record = await this.prisma.user.findUnique({ where: { email } });
      return record
        ? ok(toUser(record))
        : err(new NotFoundError('User not found.'));
    } catch (cause) {
      return err(new UnexpectedError('Could not load the user.', { cause }));
    }
  }

  async update(
    id: string,
    changes: UserChanges,
  ): Promise<Result<User, AppError>> {
    try {
      const record = await this.prisma.user.update({
        where: { id },
        data: changes,
      });
      return ok(toUser(record));
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2025')) {
        return err(new NotFoundError('User not found.', { cause }));
      }
      if (isKnownRequestError(cause, 'P2002')) {
        return err(
          new ConflictError('A user with this email already exists.', {
            cause,
          }),
        );
      }
      return err(new UnexpectedError('Could not update the user.', { cause }));
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return ok(undefined);
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2025')) {
        return err(new NotFoundError('User not found.', { cause }));
      }
      return err(new UnexpectedError('Could not delete the user.', { cause }));
    }
  }
}
