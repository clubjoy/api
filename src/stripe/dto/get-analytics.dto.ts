import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
