import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentDto, RefundPaymentDto, CreatePaymentIntentDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async processPayment(dto: CreatePaymentDto) {
    // Verify booking exists and is in correct state
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'ACCEPTED') {
      throw new BadRequestException('Booking must be in ACCEPTED state to process payment');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    // Mock payment processing
    const transactionId = `TXN-${uuidv4()}`;
    const paymentIntentId = `PI-${uuidv4()}`;

    console.log(`
💳 ===== MOCK PAYMENT PROCESSING =====
Provider: ${dto.provider}
Amount: ${dto.currency} ${dto.amount}
Transaction ID: ${transactionId}
Status: PROCESSING -> COMPLETED
======================================
    `);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        provider: dto.provider,
        amount: dto.amount,
        currency: dto.currency,
        status: 'COMPLETED',
        transactionId,
        paymentIntentId,
        metadata: {
          mockPayment: true,
          processedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`✅ Payment ${payment.id} completed successfully`);

    return payment;
  }

  async refundPayment(dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
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

    if (dto.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // Process refund through Stripe if payment has payment intent
    if (payment.provider === 'STRIPE' && payment.paymentIntentId) {
      try {
        const refund = await this.stripe.createRefund({
          paymentIntentId: payment.paymentIntentId,
          amount: dto.amount,
          reason: dto.reason,
        });

        this.logger.log(`Stripe refund created: ${refund.id} for payment ${payment.id}`);

        // Update payment record with Stripe refund
        const refunded = await this.prisma.payment.update({
          where: { id: dto.paymentId },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
            refundReason: dto.reason,
            metadata: {
              ...((payment.metadata as object) || {}),
              stripeRefundId: refund.id,
              refundAmount: dto.amount,
              refundedAt: new Date().toISOString(),
            },
          },
        });

        return refunded;
      } catch (error) {
        this.logger.error(`Stripe refund failed: ${error.message}`, error.stack);
        throw new BadRequestException(`Failed to process refund: ${error.message}`);
      }
    }

    // Fallback for non-Stripe payments (mock processing)
    this.logger.log(`Mock refund processing for ${payment.provider} payment ${payment.id}`);

    const refunded = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundReason: dto.reason,
      },
    });

    this.logger.log(`Refund ${refunded.id} processed successfully`);

    return refunded;
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: true,
            experience: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByBooking(bookingId: string) {
    return this.prisma.payment.findUnique({
      where: { bookingId },
    });
  }

  /**
   * Create a Stripe payment intent for a booking
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto, userId: string) {
    // Verify booking exists and belongs to user
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        user: true,
        experience: {
          include: { host: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only create payment intents for your own bookings');
    }

    // Check booking status - allow ACCEPTED bookings for payment
    if (booking.status !== 'ACCEPTED') {
      throw new BadRequestException('Booking must be in ACCEPTED state to create payment intent');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingPayment) {
      // If payment exists and has a payment intent, retrieve it
      if (existingPayment.paymentIntentId) {
        const paymentIntent = await this.stripe.retrievePaymentIntent(
          existingPayment.paymentIntentId,
        );

        // If payment intent is already succeeded, return error
        if (paymentIntent.status === 'succeeded') {
          throw new BadRequestException('Payment already completed for this booking');
        }

        // If payment intent is still valid, return existing
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
          return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            payment: existingPayment,
          };
        }
      }
    }

    // Create Stripe payment intent
    const amount = dto.amount || Number(booking.totalPrice);
    const currency = dto.currency || booking.currency || 'EUR';

    const paymentIntent = await this.stripe.createPaymentIntent({
      amount,
      currency,
      bookingId: booking.id,
      description: `Booking ${booking.bookingNumber} - ${booking.experience.title}`,
    });

    // Create or update payment record
    const payment = existingPayment
      ? await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentIntentId: paymentIntent.id,
            amount,
            currency,
            status: 'PENDING',
            metadata: {
              stripePaymentIntent: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
            },
          },
        })
      : await this.prisma.payment.create({
          data: {
            bookingId: booking.id,
            provider: 'STRIPE',
            amount,
            currency,
            status: 'PENDING',
            paymentIntentId: paymentIntent.id,
            metadata: {
              stripePaymentIntent: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
            },
          },
        });

    this.logger.log(
      `Payment intent created for booking ${booking.bookingNumber}: ${paymentIntent.id}`,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      payment,
    };
  }

  /**
   * Handle successful payment (called by webhook or manual confirmation)
   */
  async handlePaymentSuccess(paymentIntentId: string) {
    // Find payment by payment intent ID
    const payment = await this.prisma.payment.findFirst({
      where: { paymentIntentId },
      include: {
        booking: {
          include: {
            user: true,
            experience: {
              include: { host: true },
            },
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for payment intent: ${paymentIntentId}`);
      return null;
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
        metadata: {
          ...((payment.metadata as object) || {}),
          stripeStatus: paymentIntent.status,
          stripePaymentMethod: typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method?.id,
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Update booking status to CONFIRMED
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    this.logger.log(`Payment completed for booking ${payment.booking.bookingNumber}`);

    return payment;
  }

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey() {
    return {
      publishableKey: this.stripe.getPublishableKey(),
    };
  }

  /**
   * Find payment by payment intent ID
   */
  async findByPaymentIntentId(paymentIntentId: string) {
    return this.prisma.payment.findFirst({
      where: { paymentIntentId },
      include: {
        booking: {
          include: {
            user: true,
            experience: {
              include: { host: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
    metadata?: Record<string, any>,
  ) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId }
    });

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        metadata: metadata && existingPayment
          ? {
              ...(existingPayment.metadata as object || {}),
              ...metadata,
            }
          : undefined,
      },
    });
  }
}
