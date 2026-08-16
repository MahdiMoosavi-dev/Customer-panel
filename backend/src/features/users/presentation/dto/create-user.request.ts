import { IsEmail, IsString, MinLength } from 'class-validator';
import type { CreateUserDto } from '../../application/dto/create-user.dto';

/**
 * Validated HTTP request body. Implementing the application-layer interface
 * keeps this in sync with what the use case expects — a compile error if
 * the two ever diverge — while keeping `class-validator` out of
 * `application/`.
 */
export class CreateUserRequest implements CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
