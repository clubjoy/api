import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Promotion code', example: 'SUMMER2026' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Percentage discount (0-100)', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentOff?: number;

  @ApiPropertyOptional({ description: 'Fixed amount discount', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOff?: number;

  @ApiPropertyOptional({ description: 'Currency for amount discount', example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Duration type', enum: ['once', 'repeating', 'forever'], example: 'once' })
  @IsOptional()
  @IsEnum(['once', 'repeating', 'forever'])
  duration?: 'once' | 'repeating' | 'forever';

  @ApiPropertyOptional({ description: 'Duration in months (for repeating)', example: 3 })
  @IsOptional()
  @IsNumber()
  durationInMonths?: number;

  @ApiPropertyOptional({ description: 'Maximum number of redemptions', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  redeemBy?: string;
}
