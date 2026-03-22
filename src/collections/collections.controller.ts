import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddExperienceDto,
  ReorderExperiencesDto,
  ReorderCollectionsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { Role, Language } from '@prisma/client';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('published')
  @ApiOperation({ summary: 'Get all published collections (public)' })
  @ApiQuery({ name: 'locale', enum: Language, required: false })
  findAllPublished(@Query('locale') locale?: Language) {
    return this.collectionsService.findAllPublished(locale);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all collections (OWNER only)' })
  findAll() {
    return this.collectionsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get collection by slug (public)' })
  @ApiQuery({ name: 'locale', enum: Language, required: false })
  findBySlug(@Param('slug') slug: string, @Query('locale') locale?: Language) {
    return this.collectionsService.findBySlug(slug, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collection (OWNER only)' })
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection (OWNER only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete collection (OWNER only)' })
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }

  @Post(':id/experiences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add experience to collection (OWNER only)' })
  addExperience(@Param('id') id: string, @Body() dto: AddExperienceDto) {
    return this.collectionsService.addExperience(id, dto.experienceId);
  }

  @Delete(':id/experiences/:experienceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove experience from collection (OWNER only)' })
  removeExperience(@Param('id') id: string, @Param('experienceId') experienceId: string) {
    return this.collectionsService.removeExperience(id, experienceId);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder experiences in collection (OWNER only)' })
  reorderExperiences(@Param('id') id: string, @Body() dto: ReorderExperiencesDto) {
    return this.collectionsService.reorderExperiences(id, dto.experienceIds);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder all collections (OWNER only)' })
  reorderCollections(@Body() dto: ReorderCollectionsDto) {
    return this.collectionsService.reorderCollections(dto.collectionIds);
  }
}
