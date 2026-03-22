import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional } from 'class-validator';

export class RescheduleBookingDto {
  @ApiProperty({ example: '2024-06-20T10:00:00Z' })
  @IsDateString()
  newDate: string;

  @ApiProperty({ example: 'Original date no longer works', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
