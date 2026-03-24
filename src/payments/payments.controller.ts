import { Controller, Post, Get, Body, Param, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, RefundPaymentDto, CreatePaymentIntentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a Stripe payment intent for a booking' })
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto, @CurrentUser() user: any) {
    return this.paymentsService.createPaymentIntent(dto, user.id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get Stripe publishable key' })
  getConfig() {
    return this.paymentsService.getPublishableKey();
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // This endpoint will be implemented for webhook handling
    // For now, return a placeholder
    return { received: true };
  }
}
