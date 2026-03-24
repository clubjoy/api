import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetTransactionsDto {
  @ApiPropertyOptional({ description: 'Number of results to return', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor - starting after' })
  @IsOptional()
  @IsString()
  startingAfter?: string;

  @ApiPropertyOptional({ description: 'Pagination cursor - ending before' })
  @IsOptional()
  @IsString()
  endingBefore?: string;

  @ApiPropertyOptional({ description: 'Start date filter', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Transaction type filter', example: 'charge' })
  @IsOptional()
  @IsString()
  type?: string;
}
