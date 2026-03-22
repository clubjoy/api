import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExperienceDto } from './create-experience.dto';

// Omit availability from update - it should be managed separately via dedicated endpoints
export class UpdateExperienceDto extends PartialType(
  OmitType(CreateExperienceDto, ['availability'] as const)
) {}
