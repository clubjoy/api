import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddExperienceDto {
  @ApiProperty({ example: 'cjexp123456', description: 'Experience ID to add to collection' })
  @IsString()
  experienceId: string;
}
