import { Module } from '@nestjs/common';
import { AuthModule } from '@/features/auth';
import { GreetingModule } from '@/features/greeting';
import { UsersModule } from '@/features/users';
import { PrismaModule } from '@/shared/prisma/prisma.module';

/** Root module: composes feature modules, holds no logic of its own. */
@Module({
  imports: [PrismaModule, GreetingModule, UsersModule, AuthModule],
})
export class AppModule {}
