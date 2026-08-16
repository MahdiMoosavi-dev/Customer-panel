/** Serializable shape returned to callers. Never carries the password hash. */
export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
