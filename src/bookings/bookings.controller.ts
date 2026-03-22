import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  CancelBookingDto,
  RejectBookingDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (USER)' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings (user bookings or host bookings)' })
  findAll(@CurrentUser() user: any) {
    return this.bookingsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user.id, user.role);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept booking (HOST only, within 24h)' })
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.accept(id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject booking (HOST only)' })
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectBookingDto) {
    return this.bookingsService.reject(id, user.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking (USER or HOST)' })
  cancel(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(id, user.id, user.role, dto);
  }
}
