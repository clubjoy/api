import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Looking forward to the experience!' })
  @IsString()
  @MinLength(1)
  content: string;
}
