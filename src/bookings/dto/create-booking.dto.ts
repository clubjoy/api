import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, Min, IsOptional, IsEmail } from 'class-validator';

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

  // Guest checkout fields (required if not authenticated)
  @ApiProperty({ example: 'guest@example.com', required: false, description: 'Required for guest checkout' })
  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @ApiProperty({ example: 'John', required: false, description: 'Required for guest checkout' })
  @IsString()
  @IsOptional()
  guestFirstName?: string;

  @ApiProperty({ example: 'Doe', required: false, description: 'Required for guest checkout' })
  @IsString()
  @IsOptional()
  guestLastName?: string;

  @ApiProperty({ example: '+1234567890', required: false, description: 'Optional guest phone' })
  @IsString()
  @IsOptional()
  guestPhone?: string;
}
