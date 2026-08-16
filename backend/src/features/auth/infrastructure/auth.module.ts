import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env, TOKEN_SERVICE, type TokenService } from '@/core';
import { UsersModule, VerifyUserCredentialsUseCase } from '@/features/users';
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { AuthController } from '../presentation/controllers/auth.controller';
import { JwtTokenService } from './services/jwt-token.service';

/**
 * Global — like `PrismaModule` — because `JwtAuthGuard` (in `shared/http/`)
 * is a cross-cutting concern every future feature will reach for with
 * `@UseGuards`. `TOKEN_SERVICE`'s port lives in `core/` rather than here so
 * the guard never has to import this feature — see docs/08-decisions.md
 * for the circular-import this avoids.
 */
@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: { expiresIn: env.jwtExpiresInSeconds },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    {
      provide: LoginUseCase,
      useFactory: (
        verifyUserCredentials: VerifyUserCredentialsUseCase,
        tokenService: TokenService,
      ) => new LoginUseCase(verifyUserCredentials, tokenService),
      inject: [VerifyUserCredentialsUseCase, TOKEN_SERVICE],
    },
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, TOKEN_SERVICE],
})
export class AuthModule {}
