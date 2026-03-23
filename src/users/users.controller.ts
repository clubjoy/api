import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { Role } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public endpoints (no auth required)
  @Get('hosts/:id/public')
  @ApiOperation({ summary: 'Get public host profile by ID' })
  getHostPublicProfile(@Param('id') id: string) {
    return this.usersService.getHostPublicProfile(id);
  }

  // Protected endpoints (auth required)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()

  @Post()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Create a new user (OWNER only)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Get all users (OWNER only)' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft delete user (OWNER only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Host Management Endpoints
  @Post('hosts')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Manually create a new host (OWNER only)' })
  createHost(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.createHost(createUserDto, req.user.userId);
  }

  @Post(':id/block')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Block a host (OWNER only)' })
  blockHost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.usersService.blockHost(id, req.user.userId, reason);
  }

  @Post(':id/unblock')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Unblock a host (OWNER only)' })
  unblockHost(@Param('id') id: string) {
    return this.usersService.unblockHost(id);
  }

  @Patch(':id/visibility')
  @Roles(Role.OWNER, Role.HOST)
  @ApiOperation({ summary: 'Toggle host profile visibility' })
  toggleVisibility(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ) {
    return this.usersService.toggleProfileVisibility(id, isPublic);
  }
}
