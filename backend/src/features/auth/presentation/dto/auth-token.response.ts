import { ApiProperty } from '@nestjs/swagger';
import type { AuthTokenDto } from '../../application/dto/auth-token.dto';

export class AuthTokenResponse implements AuthTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT bearer token — send as `Authorization: Bearer <token>`.',
  })
  accessToken!: string;
}
