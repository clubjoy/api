import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderExperiencesDto {
  @ApiProperty({
    example: ['exp1', 'exp2', 'exp3'],
    description: 'Array of experience IDs in desired order',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  experienceIds: string[];
}
