import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class UpdateCollectionDto {
  @ApiProperty({ example: 'Best of Tuscany', required: false })
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Discover the most amazing experiences in Tuscany', required: false })
  @IsString()
  @MinLength(10)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/tuscany.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
