import { ApiProperty } from '@nestjs/swagger';
import type { ProductDto } from '../../application/dto/product.dto';

/** Documentation-only counterpart to `ProductDto`. */
export class ProductResponse implements ProductDto {
  @ApiProperty({ example: '81c0080b-c0ad-4630-82ed-626a27faad70' })
  id!: string;

  @ApiProperty({ example: 'Ergonomic Office Chair' })
  title!: string;

  @ApiProperty({ example: 'A comfortable chair for long work sessions.' })
  shortDescription!: string;

  @ApiProperty({
    example:
      'Full-grain leather upholstery, adjustable lumbar support, and a five-year warranty.',
  })
  longDescription!: string;

  @ApiProperty({ example: 'https://example.com/images/chair.jpg' })
  imageUrl!: string;

  @ApiProperty({ example: 249.99 })
  price!: number;

  @ApiProperty({ example: 'Furniture' })
  category!: string;

  @ApiProperty({ example: '2026-08-16T15:00:52.037Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-16T15:00:52.037Z' })
  updatedAt!: string;
}
