import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderCollectionsDto {
  @ApiProperty({
    example: ['col1', 'col2', 'col3'],
    description: 'Array of collection IDs in desired order',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  collectionIds: string[];
}
