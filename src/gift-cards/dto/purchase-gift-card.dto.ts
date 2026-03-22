import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsEmail, IsOptional, Min, Max } from 'class-validator';

export class PurchaseGiftCardDto {
  @ApiProperty({ example: 100, description: 'Gift card amount in EUR (1-1000)' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  amount: number;

  @ApiProperty({
    example: 'recipient@example.com',
    description: 'Recipient email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Recipient name',
    required: false,
  })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty({
    example: 'Happy Birthday! Enjoy an amazing experience.',
    description: 'Personal message to recipient',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: 365,
    description: 'Days until expiration (default: 365)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  expiresInDays?: number;
}
