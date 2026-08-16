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
import type { Paginated } from '@/core';
import { ApiErrorResponse } from '@/shared/http/api-error-response';
import { JwtAuthGuard } from '@/shared/http/jwt-auth.guard';
import { toHttpException } from '@/shared/http/to-http-exception';
import type { ProductDto } from '../../application/dto/product.dto';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { CreateProductRequest } from '../dto/create-product.request';
import {
  GetProductsRequest,
  PRODUCT_SORT_FIELDS,
  SORT_ORDERS,
} from '../dto/get-products.request';
import { PaginatedProductsResponse } from '../dto/get-products.response';
import { ProductResponse } from '../dto/product.response';
import { UpdateProductRequest } from '../dto/update-product.request';

const PRODUCT_ID_PARAM = {
  name: 'id',
  example: '81c0080b-c0ad-4630-82ed-626a27faad70',
};

/**
 * Browsing (`GET`) is public; creating/updating/deleting requires a bearer
 * token. There is no admin/role concept yet, so "authenticated" is the
 * whole bar — the same known gap already accepted for
 * `PATCH`/`DELETE /users/:id`, see docs/08-decisions.md.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a product.' })
  @ApiResponse({ status: 201, type: ProductResponse })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponse,
    description: 'Missing or invalid bearer token.',
  })
  async create(@Body() body: CreateProductRequest): Promise<ProductDto> {
    const result = await this.createProductUseCase.execute(body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Get()
  @ApiOperation({
    summary: 'List products with search, sorting, and pagination.',
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
    example: 'chair',
    description: 'Case-insensitive match against title.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: PRODUCT_SORT_FIELDS,
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
  @ApiResponse({ status: 200, type: PaginatedProductsResponse })
  async findAll(
    @Query() query: GetProductsRequest,
  ): Promise<Paginated<ProductDto>> {
    const result = await this.getProductsUseCase.execute(query);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id.' })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiResponse({ status: 200, type: ProductResponse })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Product not found.',
  })
  async findOne(@Param('id') id: string): Promise<ProductDto> {
    const result = await this.getProductByIdUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product.' })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiResponse({ status: 200, type: ProductResponse })
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
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductRequest,
  ): Promise<ProductDto> {
    const result = await this.updateProductUseCase.execute(id, body);
    if (!result.ok) throw toHttpException(result.error);
    return result.value;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product.' })
  @ApiParam(PRODUCT_ID_PARAM)
  @ApiNoContentResponse({ description: 'The product was deleted.' })
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
  async remove(@Param('id') id: string): Promise<void> {
    const result = await this.deleteProductUseCase.execute(id);
    if (!result.ok) throw toHttpException(result.error);
  }
}
