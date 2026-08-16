import { Module } from '@nestjs/common';
import { AuthModule } from '@/features/auth';
import { CartModule } from '@/features/cart';
import { GreetingModule } from '@/features/greeting';
import { ProductsModule } from '@/features/products';
import { UsersModule } from '@/features/users';
import { PrismaModule } from '@/shared/prisma/prisma.module';

/** Root module: composes feature modules, holds no logic of its own. */
@Module({
  imports: [
    PrismaModule,
    GreetingModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
  ],
})
export class AppModule {}
