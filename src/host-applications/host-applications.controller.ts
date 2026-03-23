import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HostApplicationsService } from './host-applications.service';
import { CreateHostApplicationDto } from './dto';

@ApiTags('host-applications')
@Controller('host-applications')
export class HostApplicationsController {
  constructor(private readonly hostApplicationsService: HostApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a host application' })
  create(@Body() dto: CreateHostApplicationDto) {
    return this.hostApplicationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all host applications (admin only in production)' })
  findAll(@Query('status') status?: string) {
    return this.hostApplicationsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific host application (admin only in production)' })
  findOne(@Param('id') id: string) {
    return this.hostApplicationsService.findOne(id);
  }
}
