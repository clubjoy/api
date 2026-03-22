import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'booking_123' })
  @IsString()
  bookingId: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  currency: string;
}
