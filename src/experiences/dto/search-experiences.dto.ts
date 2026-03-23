import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceStatus } from '@prisma/client';

export enum SortBy {
  POPULAR = 'popular',
  PRICE_ASC = 'price-asc',
  PRICE_DESC = 'price-desc',
  RATING = 'rating',
  NEWEST = 'newest',
}

export class SearchExperiencesDto {
  @ApiProperty({ required: false, example: 'wine tasting' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ required: false, example: 'Food & Drink' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({ required: false, example: 200 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ required: false, example: 43.7711 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ required: false, example: 11.2486 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ required: false, example: 50, description: 'Radius in km' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  radius?: number;

  @ApiProperty({ enum: SortBy, default: SortBy.POPULAR, required: false })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @ApiProperty({ default: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ default: 20, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ enum: ExperienceStatus, required: false })
  @IsEnum(ExperienceStatus)
  @IsOptional()
  status?: ExperienceStatus;
}
