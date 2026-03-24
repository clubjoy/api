import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCouponDto, RefundPaymentDto, GetTransactionsDto, GetAnalyticsDto } from './dto';

@ApiTags('stripe')
@Controller('stripe')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('balance')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Get Stripe account balance (OWNER only)' })
  getBalance() {
    return this.stripeService.getBalance();
  }

  @Get('transactions')
  @Roles('OWNER')
  @ApiOperation({ summary: 'List Stripe transactions (OWNER only)' })
  getTransactions(@Query() query: GetTransactionsDto) {
    return this.stripeService.getTransactions({
      limit: query.limit,
      startingAfter: query.startingAfter,
      endingBefore: query.endingBefore,
      type: query.type,
      created: query.startDate || query.endDate ? {
        gte: query.startDate ? Math.floor(new Date(query.startDate).getTime() / 1000) : undefined,
        lte: query.endDate ? Math.floor(new Date(query.endDate).getTime() / 1000) : undefined,
      } : undefined,
    });
  }

  @Get('analytics')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Get revenue analytics (OWNER only)' })
  getAnalytics(@Query() query: GetAnalyticsDto) {
    return this.stripeService.getAnalytics({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Post('refund/:paymentId')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Refund a payment (OWNER only)' })
  refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.stripeService.refundPayment(paymentId, {
      amount: dto.amount,
      reason: dto.reason,
    });
  }

  @Post('coupons')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Create a coupon/promotion code (OWNER only)' })
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.stripeService.createCoupon({
      code: dto.code,
      percentOff: dto.percentOff,
      amountOff: dto.amountOff,
      currency: dto.currency,
      duration: dto.duration,
      durationInMonths: dto.durationInMonths,
      maxRedemptions: dto.maxRedemptions,
      redeemBy: dto.redeemBy ? new Date(dto.redeemBy) : undefined,
    });
  }

  @Get('coupons')
  @Roles('OWNER')
  @ApiOperation({ summary: 'List all coupons (OWNER only)' })
  getCoupons(@Query('limit') limit?: number) {
    return this.stripeService.getCoupons({ limit });
  }

  @Get('promotion-codes')
  @Roles('OWNER')
  @ApiOperation({ summary: 'List promotion codes (OWNER only)' })
  getPromotionCodes(
    @Query('limit') limit?: number,
    @Query('active') active?: boolean,
  ) {
    return this.stripeService.getPromotionCodes({ limit, active });
  }
}
