import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUrl, Min, MinLength } from 'class-validator';
import type { CreateProductDto } from '../../application/dto/create-product.dto';

export class CreateProductRequest implements CreateProductDto {
  @ApiProperty({ example: 'Ergonomic Office Chair' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'A comfortable chair for long work sessions.' })
  @IsString()
  @MinLength(2)
  shortDescription!: string;

  @ApiProperty({
    example:
      'Full-grain leather upholstery, adjustable lumbar support, and a five-year warranty.',
  })
  @IsString()
  @MinLength(2)
  longDescription!: string;

  @ApiProperty({ example: 'https://example.com/images/chair.jpg' })
  @IsUrl()
  imageUrl!: string;

  @ApiProperty({ example: 249.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'Furniture' })
  @IsString()
  @MinLength(2)
  category!: string;
}
