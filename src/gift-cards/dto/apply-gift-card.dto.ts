import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApplyGiftCardDto {
  @ApiProperty({
    example: 'CJ-GIFT-ABC12345',
    description: 'Gift card code',
  })
  @IsString()
  code: string;
}
