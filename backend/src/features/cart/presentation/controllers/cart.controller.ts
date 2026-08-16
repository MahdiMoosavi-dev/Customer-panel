import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiErrorResponse } from '@/shared/http/api-error-response';
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { CartItemDto } from '../../application/dto/cart-item.dto';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { AddCartItemRequest } from '../dto/add-cart-item.request';
import { CartItemResponse } from '../dto/cart-item.response';

/**
 * Every route needs a bearer token — a cart always belongs to the caller,
 * identified from `request.user.sub`, never from the body or a path param.
 */
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addCartItemUseCase: AddCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's cart." })
  @ApiResponse({ status: 200, type: CartItemResponse, isArray: true })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  async findAll(@Req() request: Request): Promise<CartItemDto[]> {
    const result = await this.getCartUseCase.execute(request.user!.sub);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Post('items')
  @ApiOperation({
    summary:
      'Add a product to the cart, or increment its quantity if already present.',
  })
  @ApiResponse({ status: 201, type: CartItemResponse })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Product not found.',
  })
  async addItem(
    @Req() request: Request,
    @Body() body: AddCartItemRequest,
  ): Promise<CartItemDto> {
    const result = await this.addCartItemUseCase.execute(
      request.user!.sub,
      body,
    );
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from the cart.' })
  @ApiParam({
    name: 'productId',
    example: '81c0080b-c0ad-4630-82ed-626a27faad70',
  })
  @ApiNoContentResponse({
    description: 'The product was removed from the cart.',
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'The product is not in the cart.',
  })
  async removeItem(
    @Req() request: Request,
    @Param('productId') productId: string,
  ): Promise<void> {
    const result = await this.removeCartItemUseCase.execute(
      request.user!.sub,
      productId,
    );
    if (!result.ok) throw toHttpException(result.error);
  }
}
