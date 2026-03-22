import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '@prisma/client';

export class CollectionTranslationDto {
  @ApiProperty({ enum: Language, example: 'en' })
  @IsString()
  language: Language;

  @ApiProperty({ example: 'Best of Tuscany' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Discover the most amazing experiences in Tuscany' })
  @IsString()
  @MinLength(10)
  description: string;
}

export class CreateCollectionDto {
  @ApiProperty({ example: 'Best of Tuscany' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Discover the most amazing experiences in Tuscany' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 'https://example.com/tuscany.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    type: [CollectionTranslationDto],
    required: false,
    description: 'Translations for other languages',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionTranslationDto)
  @IsOptional()
  translations?: CollectionTranslationDto[];
}
