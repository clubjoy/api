import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Refund amount (leave empty for full refund)', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Reason for refund', example: 'Customer request' })
  @IsOptional()
  @IsString()
  reason?: string;
}
