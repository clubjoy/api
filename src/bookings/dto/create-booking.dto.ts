import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, Min, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'exp_123' })
  @IsString()
  experienceId: string;

  @ApiProperty({ example: '2024-06-15T10:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-06-15T13:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '10:00', description: 'Start time in HH:mm format' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  guests: number;

  @ApiProperty({ example: 'Vegetarian options needed', required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;
}
