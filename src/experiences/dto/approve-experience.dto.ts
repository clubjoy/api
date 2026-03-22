import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectExperienceDto {
  @ApiProperty({ example: 'Please add more photos and improve the description.' })
  @IsString()
  @MinLength(10)
  reason: string;
}
