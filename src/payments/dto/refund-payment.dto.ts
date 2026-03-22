import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ example: 'payment_123' })
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Customer requested refund', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
