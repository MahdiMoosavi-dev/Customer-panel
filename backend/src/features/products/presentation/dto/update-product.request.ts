import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import type { UpdateProductDto } from '../../application/dto/update-product.dto';

export class UpdateProductRequest implements UpdateProductDto {
  @ApiPropertyOptional({ example: 'Ergonomic Office Chair' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({
    example: 'A comfortable chair for long work sessions.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  shortDescription?: string;

  @ApiPropertyOptional({
    example:
      'Full-grain leather upholstery, adjustable lumbar support, and a five-year warranty.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  longDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/chair.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 249.99, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'Furniture' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  category?: string;
}
