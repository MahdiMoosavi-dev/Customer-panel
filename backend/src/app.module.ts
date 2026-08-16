import { Module } from '@nestjs/common';
import { GreetingModule } from '@/features/greeting';

/** Root module: composes feature modules, holds no logic of its own. */
@Module({
  imports: [GreetingModule],
})
export class AppModule {}
