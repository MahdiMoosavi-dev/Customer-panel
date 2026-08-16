/**
 * Public API of the users feature. Everything else inside this folder is
 * internal — other features and the root module import only from here.
 */
export { UsersModule } from './infrastructure/users.module';
export { VerifyUserCredentialsUseCase } from './application/use-cases/verify-user-credentials.use-case';
export type { CredentialsDto } from './application/dto/credentials.dto';
export type { UserDto } from './application/dto/user.dto';
