import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import type { UpdateUserDto } from '../../application/dto/update-user.dto';

export class UpdateUserRequest implements UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
