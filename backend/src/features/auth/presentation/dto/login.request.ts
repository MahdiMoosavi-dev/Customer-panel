import { IsEmail, IsString, MinLength } from 'class-validator';
import type { LoginDto } from '../../application/dto/login.dto';

export class LoginRequest implements LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
