import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RespondReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback! We are glad you enjoyed it.' })
  @IsString()
  @MinLength(3)
  hostResponse: string;
}
