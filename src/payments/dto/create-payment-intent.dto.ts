import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Amount in EUR', example: 99.99 })
  @IsNumber()
  @Min(0.5)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'EUR', default: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;
}
