import type { User } from '../../domain/entities/user';
import type { UserDto } from '../dto/user.dto';

/** Keeps the password hash from ever leaving the feature's inner layers. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
