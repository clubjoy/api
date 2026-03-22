import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectBookingDto {
  @ApiProperty({ example: 'Not available on this date' })
  @IsString()
  @MinLength(3)
  reason: string;
}
