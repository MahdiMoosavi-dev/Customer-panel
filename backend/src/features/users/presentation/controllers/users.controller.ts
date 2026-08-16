import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { UserDto } from '../../application/dto/user.dto';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { CreateUserRequest } from '../dto/create-user.request';
import { UpdateUserRequest } from '../dto/update-user.request';

/**
 * `POST /users` is the registration endpoint and stays open. Listing and
 * reading a single user require a bearer token — see docs/08-decisions.md
 * for why update/delete are not gated yet.
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateUserRequest): Promise<UserDto> {
    const result = await this.createUserUseCase.execute(body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<UserDto[]> {
    const result = await this.getUsersUseCase.execute();
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const result = await this.getUserByIdUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserRequest,
  ): Promise<UserDto> {
    const result = await this.updateUserUseCase.execute(id, body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const result = await this.deleteUserUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
  }
}
