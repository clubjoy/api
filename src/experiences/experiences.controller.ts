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
import { ExperiencesService } from './experiences.service';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
  SearchExperiencesDto,
  RejectExperienceDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { Role, ExperienceStatus } from '@prisma/client';

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOST, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new experience (HOST only)' })
  create(@CurrentUser() user: any, @Body() dto: CreateExperienceDto) {
    return this.experiencesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter experiences' })
  findAll(@Query() query: SearchExperiencesDto) {
    return this.experiencesService.findAll(query);
  }

  @Get('my-experiences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOST, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my experiences (HOST only)' })
  @ApiQuery({ name: 'status', enum: ExperienceStatus, required: false })
  getMyExperiences(@CurrentUser() user: any, @Query('status') status?: ExperienceStatus) {
    return this.experiencesService.findAll({ hostId: user.id, status });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get experience by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.experiencesService.findBySlug(slug);
  }

  @Get(':id/availability/all')
  @ApiOperation({ summary: 'Get all availability slots for an experience' })
  getAllAvailability(@Param('id') id: string) {
    return this.experiencesService.getAllAvailability(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiQuery({ name: 'date', required: true, example: '2024-06-15' })
  getAvailability(@Param('id') id: string, @Query('date') date: string) {
    return this.experiencesService.getAvailability(id, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience by ID' })
  findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOST, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update experience (HOST only, own experiences)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.experiencesService.update(id, user.id, dto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOST, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit experience for approval (HOST only)' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.experiencesService.submitForApproval(id, user.id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve experience (OWNER only)' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.experiencesService.approve(id, user.id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject experience (OWNER only)' })
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectExperienceDto) {
    return this.experiencesService.reject(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HOST, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete experience (HOST only, own experiences)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.experiencesService.remove(id, user.id);
  }
}
