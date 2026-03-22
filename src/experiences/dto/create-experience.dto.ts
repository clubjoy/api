import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  MinLength,
  IsDecimal,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @ApiProperty({ example: '2024-06-15', required: false, description: 'Specific date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: '10:00', description: 'Start time in HH:mm format' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 10, description: 'Number of available spots' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  slots: number;

  @ApiProperty({ example: 50, required: false, description: 'Override price for this slot' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiProperty({ example: false, required: false, description: 'Is this a recurring pattern' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ example: [1, 3, 5], required: false, description: 'Days of week (0=Sun, 1=Mon, etc)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  recurringDays?: number[];

  @ApiProperty({ example: '2024-12-31', required: false, description: 'End date for recurring pattern' })
  @IsDateString()
  @IsOptional()
  recurringUntil?: string;

  @ApiProperty({ example: false, required: false, description: 'Is this slot paused' })
  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;
}

export class CreateExperienceDto {
  @ApiProperty({ example: 'Wine Tasting in Tuscany' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Join us for an unforgettable wine tasting experience...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ example: 89.99, description: 'Price per person (can be 0 for free experiences)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 180, description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @ApiProperty({ example: 10, required: false, description: 'Maximum capacity - will be calculated from availability if not provided', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxGuests?: number;

  @ApiProperty({ example: 'Tuscany, Italy' })
  @IsString()
  location: string;

  @ApiProperty({ example: 43.7711, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 11.2486, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'Via delle Vigne 123', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Florence', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Italy', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: ['https://example.com/img1.jpg'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ example: 'Food & Drink' })
  @IsString()
  category: string;

  @ApiProperty({ example: ['wine', 'tasting', 'tuscany'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ type: [AvailabilitySlotDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  @IsOptional()
  availability?: AvailabilitySlotDto[];
}
