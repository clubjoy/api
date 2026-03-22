import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process a payment (MOCKED)' })
  processPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment (MOCKED)' })
  refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payment by booking ID' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }
}
