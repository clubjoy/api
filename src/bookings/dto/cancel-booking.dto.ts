import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({ example: 'Plans changed' })
  @IsString()
  @MinLength(3)
  reason: string;
}
