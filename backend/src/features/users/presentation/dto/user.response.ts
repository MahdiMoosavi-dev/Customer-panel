import { ApiProperty } from '@nestjs/swagger';
import type { UserDto } from '../../application/dto/user.dto';

/** Documentation-only counterpart to `UserDto` — never carries a password. */
export class UserResponse implements UserDto {
  @ApiProperty({ example: '81c0080b-c0ad-4630-82ed-626a27faad70' })
  id!: string;

  @ApiProperty({ example: 'ada@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: '2026-08-16T15:00:52.037Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-16T15:00:52.037Z' })
  updatedAt!: string;
}
