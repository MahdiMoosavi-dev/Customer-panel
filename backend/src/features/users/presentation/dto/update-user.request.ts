import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import type { UpdateUserDto } from '../../application/dto/update-user.dto';

export class UpdateUserRequest implements UpdateUserDto {
  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Ada L.', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ minLength: 8, writeOnly: true })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
