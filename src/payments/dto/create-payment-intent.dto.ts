import { IsString, IsNumber, IsOptional, Min, IsEmail } from 'class-validator';
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

  @ApiProperty({ description: 'Guest email for guest checkout', required: false })
  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @ApiProperty({ description: 'Guest first name for guest checkout', required: false })
  @IsString()
  @IsOptional()
  guestFirstName?: string;

  @ApiProperty({ description: 'Guest last name for guest checkout', required: false })
  @IsString()
  @IsOptional()
  guestLastName?: string;

  @ApiProperty({ description: 'Guest phone for guest checkout', required: false })
  @IsString()
  @IsOptional()
  guestPhone?: string;
}
