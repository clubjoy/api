import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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

    // Mock refund processing
    console.log(`
💸 ===== MOCK REFUND PROCESSING =====
Provider: ${payment.provider}
Original Amount: ${payment.currency} ${payment.amount}
Refund Amount: ${payment.currency} ${dto.amount}
Transaction ID: ${payment.transactionId}
Reason: ${dto.reason || 'No reason provided'}
Status: PROCESSING -> REFUNDED
=====================================
    `);

    // Simulate refund processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update payment record
    const refunded = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundReason: dto.reason,
      },
    });

    console.log(`✅ Refund ${refunded.id} processed successfully`);

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
}
