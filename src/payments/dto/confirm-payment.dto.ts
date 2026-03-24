import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Stripe Payment Intent ID' })
  @IsString()
  paymentIntentId: string;
}
