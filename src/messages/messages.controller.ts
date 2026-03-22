import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@ApiTags('messages')
@Controller('bookings/:bookingId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages for a booking' })
  findByBooking(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.messagesService.findByBooking(bookingId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  send(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(bookingId, user.id, dto);
  }
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageActionsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.markAsRead(id, user.id);
  }
}
