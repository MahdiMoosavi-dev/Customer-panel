import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import type { AddCartItemDto } from '../../application/dto/add-cart-item.dto';

export class AddCartItemRequest implements AddCartItemDto {
  @ApiProperty({ example: '81c0080b-c0ad-4630-82ed-626a27faad70' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description:
      'Defaults to 1. Adding an already-present product increments it.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
