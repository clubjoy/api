import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  /**
   * Get Stripe account balance
   */
  async getBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return {
        available: balance.available.map((b) => ({
          amount: b.amount / 100, // Convert from cents to dollars
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map((b) => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve Stripe balance: ' + error.message);
    }
  }

  /**
   * List Stripe transactions (Balance Transactions)
   */
  async getTransactions(params?: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
    created?: { gte?: number; lte?: number };
    type?: string;
  }) {
    try {
      const limit = params?.limit || 100;
      const transactions = await this.stripe.balanceTransactions.list({
        limit,
        starting_after: params?.startingAfter,
        ending_before: params?.endingBefore,
        created: params?.created,
        type: params?.type,
      });

      return {
        data: transactions.data.map((txn) => ({
          id: txn.id,
          amount: txn.amount / 100,
          net: txn.net / 100,
          fee: txn.fee / 100,
          currency: txn.currency.toUpperCase(),
          type: txn.type,
          status: txn.status,
          description: txn.description,
          created: new Date(txn.created * 1000),
          availableOn: new Date(txn.available_on * 1000),
          source: txn.source,
        })),
        hasMore: transactions.has_more,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve transactions: ' + error.message);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = params?.endDate || new Date();

      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      // Fetch charges for revenue calculation
      const charges = await this.stripe.charges.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      });

      // Calculate revenue stats
      const totalRevenue = charges.data
        .filter((c) => c.status === 'succeeded')
        .reduce((sum, c) => sum + c.amount, 0) / 100;

      const refundedAmount = charges.data
        .filter((c) => c.refunded)
        .reduce((sum, c) => sum + (c.amount_refunded || 0), 0) / 100;

      const netRevenue = totalRevenue - refundedAmount;

      // Payment method breakdown
      const paymentMethods: Record<string, number> = {};
      charges.data.forEach((charge) => {
        const method = charge.payment_method_details?.type || 'unknown';
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      });

      // Daily revenue for charts
      const dailyRevenue: Record<string, number> = {};
      charges.data.forEach((charge) => {
        if (charge.status === 'succeeded') {
          const date = new Date(charge.created * 1000).toISOString().split('T')[0];
          dailyRevenue[date] = (dailyRevenue[date] || 0) + charge.amount / 100;
        }
      });

      return {
        summary: {
          totalRevenue,
          refundedAmount,
          netRevenue,
          transactionCount: charges.data.length,
          successfulTransactions: charges.data.filter((c) => c.status === 'succeeded').length,
        },
        paymentMethods,
        dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
          date,
          amount,
        })),
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve analytics: ' + error.message);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, params?: {
    amount?: number;
    reason?: string;
  }) {
    // Get payment from database
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    if (payment.refundedAt) {
      throw new BadRequestException('Payment already refunded');
    }

    if (!payment.paymentIntentId && !payment.transactionId) {
      throw new BadRequestException('Payment has no Stripe transaction ID');
    }

    try {
      const refundAmount = params?.amount
        ? Math.round(params.amount * 100)
        : Math.round(Number(payment.amount) * 100);

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.paymentIntentId || undefined,
        charge: payment.transactionId || undefined,
        amount: refundAmount,
        reason: params?.reason as any || 'requested_by_customer',
      });

      // Update payment record
      const refunded = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: params?.reason,
          metadata: {
            ...(payment.metadata as any),
            stripeRefundId: refund.id,
            refundedAmount: refundAmount / 100,
          },
        },
      });

      console.log(`✅ Refund ${refund.id} processed for payment ${paymentId}`);

      return {
        payment: refunded,
        stripeRefund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to process refund: ' + error.message);
    }
  }

  /**
   * Create a coupon/promotion code
   */
  async createCoupon(params: {
    code: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration?: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
    maxRedemptions?: number;
    redeemBy?: Date;
  }) {
    try {
      // Create coupon in Stripe
      const coupon = await this.stripe.coupons.create({
        percent_off: params.percentOff,
        amount_off: params.amountOff ? Math.round(params.amountOff * 100) : undefined,
        currency: params.currency?.toLowerCase() || 'eur',
        duration: params.duration || 'once',
        duration_in_months: params.durationInMonths,
        max_redemptions: params.maxRedemptions,
        redeem_by: params.redeemBy ? Math.floor(params.redeemBy.getTime() / 1000) : undefined,
      });

      // Create promotion code
      const promotionCode = await this.stripe.promotionCodes.create({
        coupon: coupon.id,
        code: params.code.toUpperCase(),
      });

      return {
        coupon: {
          id: coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off ? coupon.amount_off / 100 : undefined,
          currency: coupon.currency?.toUpperCase(),
          duration: coupon.duration,
          valid: coupon.valid,
          timesRedeemed: coupon.times_redeemed,
          maxRedemptions: coupon.max_redemptions,
          redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : undefined,
        },
        promotionCode: {
          id: promotionCode.id,
          code: promotionCode.code,
          active: promotionCode.active,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to create coupon: ' + error.message);
    }
  }

  /**
   * List all coupons
   */
  async getCoupons(params?: { limit?: number }) {
    try {
      const coupons = await this.stripe.coupons.list({
        limit: params?.limit || 100,
      });

      return {
        data: coupons.data.map((coupon) => ({
          id: coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off ? coupon.amount_off / 100 : undefined,
          currency: coupon.currency?.toUpperCase(),
          duration: coupon.duration,
          valid: coupon.valid,
          timesRedeemed: coupon.times_redeemed,
          maxRedemptions: coupon.max_redemptions,
          redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : undefined,
          created: new Date(coupon.created * 1000),
        })),
        hasMore: coupons.has_more,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve coupons: ' + error.message);
    }
  }

  /**
   * Get promotion codes
   */
  async getPromotionCodes(params?: { limit?: number; active?: boolean }) {
    try {
      const promotionCodes = await this.stripe.promotionCodes.list({
        limit: params?.limit || 100,
        active: params?.active,
      });

      return {
        data: await Promise.all(
          promotionCodes.data.map(async (pc) => {
            const coupon = typeof pc.coupon === 'string'
              ? await this.stripe.coupons.retrieve(pc.coupon)
              : pc.coupon;

            return {
              id: pc.id,
              code: pc.code,
              active: pc.active,
              timesRedeemed: pc.times_redeemed,
              maxRedemptions: pc.max_redemptions,
              expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000) : undefined,
              coupon: {
                id: coupon.id,
                percentOff: coupon.percent_off,
                amountOff: coupon.amount_off ? coupon.amount_off / 100 : undefined,
                currency: coupon.currency?.toUpperCase(),
                duration: coupon.duration,
              },
            };
          })
        ),
        hasMore: promotionCodes.has_more,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve promotion codes: ' + error.message);
    }
  }
}
