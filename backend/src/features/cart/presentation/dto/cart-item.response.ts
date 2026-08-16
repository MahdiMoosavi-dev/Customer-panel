import { ApiProperty } from '@nestjs/swagger';
import type { CartItemDto } from '../../application/dto/cart-item.dto';

/** Documentation-only counterpart to `CartItemDto`. */
export class CartItemResponse implements CartItemDto {
  @ApiProperty({ example: '81c0080b-c0ad-4630-82ed-626a27faad70' })
  productId!: string;

  @ApiProperty({ example: 'Ergonomic Office Chair' })
  title!: string;

  @ApiProperty({ example: 'A comfortable chair for long work sessions.' })
  shortDescription!: string;

  @ApiProperty({ example: 'https://example.com/images/chair.jpg' })
  imageUrl!: string;

  @ApiProperty({ example: 249.99 })
  price!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: '2026-08-16T15:00:52.037Z' })
  addedAt!: string;
}
