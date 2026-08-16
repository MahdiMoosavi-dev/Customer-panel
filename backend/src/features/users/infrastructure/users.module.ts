import { Module } from '@nestjs/common';
import { PASSWORD_HASHER } from '../domain/services/password-hasher';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/repositories/user.repository';
import type { PasswordHasher } from '../domain/services/password-hasher';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case';
import { GetUsersUseCase } from '../application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { VerifyUserCredentialsUseCase } from '../application/use-cases/verify-user-credentials.use-case';
import { UsersController } from '../presentation/controllers/users.controller';
import { BcryptPasswordHasher } from './services/bcrypt-password-hasher';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

/**
 * Composition root for the users feature. `VerifyUserCredentialsUseCase` is
 * exported so the auth feature can log a user in without ever seeing the
 * repository or the hasher — see docs/04-patterns.md.
 */
@Module({
  controllers: [UsersController],
  providers: [
    PrismaUserRepository,
    { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    {
      provide: CreateUserUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new CreateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: GetUsersUseCase,
      useFactory: (repo: UserRepository) => new GetUsersUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: GetUserByIdUseCase,
      useFactory: (repo: UserRepository) => new GetUserByIdUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new UpdateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (repo: UserRepository) => new DeleteUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: VerifyUserCredentialsUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new VerifyUserCredentialsUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
  ],
  exports: [VerifyUserCredentialsUseCase],
})
export class UsersModule {}
