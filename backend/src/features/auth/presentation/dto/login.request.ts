import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { LoginDto } from '../../application/dto/login.dto';

export class LoginRequest implements LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 's3cret!!', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  password!: string;
}
