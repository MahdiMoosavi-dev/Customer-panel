/**
 * Public API of the greeting feature. Everything else inside this folder is
 * internal — other features and the root module import only from here.
 */
export { GreetingModule } from './infrastructure/greeting.module';
export type { GreetingDto } from './application/dto/greeting.dto';
