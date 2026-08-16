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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';
import type { Paginated } from '@/core';
import { ApiErrorResponse } from '@/shared/http/api-error-response';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { UserDto } from '../../application/dto/user.dto';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { CreateUserRequest } from '../dto/create-user.request';
import {
  GetUsersRequest,
  SORT_ORDERS,
  USER_SORT_FIELDS,
} from '../dto/get-users.request';
import { PaginatedUsersResponse } from '../dto/get-users.response';
import { UpdateUserRequest } from '../dto/update-user.request';
import { UserResponse } from '../dto/user.response';

const USER_ID_PARAM = {
  name: 'id',
  example: '81c0080b-c0ad-4630-82ed-626a27faad70',
};

/**
 * `POST /users` is the registration endpoint and stays open. Listing and
 * reading a single user require a bearer token — see docs/08-decisions.md
 * for why update/delete are not gated yet.
 */
@ApiTags('users')
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
  @ApiOperation({ summary: 'Register a new user.' })
  @ApiResponse({ status: 201, type: UserResponse })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 409,
    type: ApiErrorResponse,
    description: 'Email already in use.',
  })
  async create(@Body() body: CreateUserRequest): Promise<UserDto> {
    const result = await this.createUserUseCase.execute(body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({
    summary: 'List users with search, filtering, sorting, and pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (1-based). Defaults to 1.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page. Defaults to 20, capped at 100.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'ada',
    description: 'Case-insensitive match against name or email.',
  })
  @ApiQuery({
    name: 'createdFrom',
    required: false,
    type: String,
    example: '2026-01-01T00:00:00.000Z',
    description: 'Only users created on or after this instant (ISO 8601).',
  })
  @ApiQuery({
    name: 'createdTo',
    required: false,
    type: String,
    example: '2026-12-31T23:59:59.000Z',
    description: 'Only users created on or before this instant (ISO 8601).',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: USER_SORT_FIELDS,
    example: 'createdAt',
    description: 'Defaults to createdAt.',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: SORT_ORDERS,
    example: 'asc',
    description: 'Defaults to asc.',
  })
  @ApiResponse({ status: 200, type: PaginatedUsersResponse })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  async findAll(@Query() query: GetUsersRequest): Promise<Paginated<UserDto>> {
    const result = await this.getUsersUseCase.execute(query);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id.' })
  @ApiParam(USER_ID_PARAM)
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'User not found.',
  })
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const result = await this.getUserByIdUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user.' })
  @ApiParam(USER_ID_PARAM)
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 409,
    type: ApiErrorResponse,
    description: 'Email already in use.',
  })
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
  @ApiOperation({ summary: 'Delete a user.' })
  @ApiParam(USER_ID_PARAM)
  @ApiNoContentResponse({ description: 'The user was deleted.' })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'User not found.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    const result = await this.deleteUserUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
  }
}
