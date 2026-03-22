import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GiftCardStatus } from '@prisma/client';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique gift card code
   * Format: CJ-GIFT-XXXXX (e.g., CJ-GIFT-A7B9C)
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CJ-GIFT-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Purchase a gift card
   */
  async purchase(dto: {
    amount: number;
    purchasedBy?: string;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    expiresInDays?: number;
  }) {
    // Validate amount
    if (dto.amount <= 0 || dto.amount > 1000) {
      throw new BadRequestException('Amount must be between €1 and €1000');
    }

    // Generate unique code
    let code = this.generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.prisma.giftCard.findUnique({
        where: { code },
      });
      if (!existing) break;
      code = this.generateCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new ConflictException('Failed to generate unique code');
    }

    // Calculate expiration (default: 1 year)
    const expiresInDays = dto.expiresInDays || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create gift card
    const giftCard = await this.prisma.giftCard.create({
      data: {
        code,
        originalAmount: dto.amount,
        remainingBalance: dto.amount,
        currency: 'EUR',
        status: GiftCardStatus.ACTIVE,
        purchasedBy: dto.purchasedBy,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
        message: dto.message,
        expiresAt,
      },
      include: {
        purchaser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log gift card purchase
    console.log('[GIFT_CARD] Purchased:', {
      code: giftCard.code,
      amount: giftCard.originalAmount,
      purchasedBy: dto.purchasedBy,
      recipientEmail: dto.recipientEmail,
    });

    // TODO: Send email to recipient
    console.log('📧 [EMAIL] Gift Card Delivered');
    console.log(`To: ${dto.recipientEmail}`);
    console.log(`Subject: You received a €${dto.amount} ClubJoys gift card!`);
    console.log(`Code: ${code}`);
    console.log(`Message: ${dto.message || 'Enjoy your experience!'}`);

    return giftCard;
  }

  /**
   * Check gift card balance
   */
  async checkBalance(code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Check if expired
    if (new Date() > giftCard.expiresAt) {
      if (giftCard.status === GiftCardStatus.ACTIVE) {
        await this.prisma.giftCard.update({
          where: { id: giftCard.id },
          data: { status: GiftCardStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Gift card has expired');
    }

    // Check if cancelled
    if (giftCard.status === GiftCardStatus.CANCELLED) {
      throw new BadRequestException('Gift card has been cancelled');
    }

    // Check if fully redeemed
    if (giftCard.status === GiftCardStatus.REDEEMED) {
      throw new BadRequestException('Gift card has been fully redeemed');
    }

    return {
      code: giftCard.code,
      remainingBalance: giftCard.remainingBalance,
      originalAmount: giftCard.originalAmount,
      currency: giftCard.currency,
      expiresAt: giftCard.expiresAt,
      status: giftCard.status,
    };
  }

  /**
   * Apply gift card to booking
   */
  async applyToBooking(bookingId: string, code: string, userId: string) {
    // Validate gift card
    const balanceCheck = await this.checkBalance(code);
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingGiftCards: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      throw new BadRequestException('Booking does not belong to you');
    }

    // Check if gift card already applied to this booking
    const alreadyApplied = booking.bookingGiftCards.some(
      (bgc) => bgc.giftCardId === giftCard.id,
    );

    if (alreadyApplied) {
      throw new ConflictException('Gift card already applied to this booking');
    }

    // Calculate amount to use (minimum of balance and booking price)
    const remainingBookingAmount = Number(booking.totalPrice);
    const amountToUse = Math.min(
      Number(giftCard.remainingBalance),
      remainingBookingAmount,
    );

    // Apply gift card
    const bookingGiftCard = await this.prisma.bookingGiftCard.create({
      data: {
        bookingId,
        giftCardId: giftCard.id,
        amountUsed: amountToUse,
      },
    });

    // Update gift card balance
    const newBalance = Number(giftCard.remainingBalance) - amountToUse;
    await this.prisma.giftCard.update({
      where: { id: giftCard.id },
      data: {
        remainingBalance: newBalance,
        status: newBalance === 0 ? GiftCardStatus.REDEEMED : giftCard.status,
        redeemedAt: newBalance === 0 ? new Date() : undefined,
      },
    });

    console.log('[GIFT_CARD] Applied to booking:', {
      code: giftCard.code,
      bookingId,
      amountUsed: amountToUse,
      remainingBalance: newBalance,
    });

    return {
      bookingGiftCard,
      amountUsed: amountToUse,
      remainingBalance: newBalance,
    };
  }

  /**
   * Get user's gift cards
   */
  async getUserGiftCards(userId: string) {
    const giftCards = await this.prisma.giftCard.findMany({
      where: {
        purchasedBy: userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        bookingGiftCards: {
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return giftCards;
  }

  /**
   * Get all gift cards (Admin only)
   */
  async findAll(filters?: {
    status?: GiftCardStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { recipientEmail: { contains: filters.search, mode: 'insensitive' } },
        { recipientName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const giftCards = await this.prisma.giftCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        purchaser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bookingGiftCards: {
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
              },
            },
          },
        },
      },
    });

    return giftCards;
  }

  /**
   * Cancel gift card (Admin only)
   */
  async cancel(id: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { id },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (giftCard.status === GiftCardStatus.REDEEMED) {
      throw new BadRequestException('Cannot cancel fully redeemed gift card');
    }

    const updated = await this.prisma.giftCard.update({
      where: { id },
      data: {
        status: GiftCardStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    console.log('[GIFT_CARD] Cancelled:', {
      code: giftCard.code,
      cancelledAt: updated.cancelledAt,
    });

    return updated;
  }

  /**
   * Get analytics
   */
  async getAnalytics() {
    const [
      totalGiftCards,
      activeCards,
      redeemedCards,
      expiredCards,
      totalPurchased,
      totalRedeemed,
    ] = await Promise.all([
      this.prisma.giftCard.count(),
      this.prisma.giftCard.count({ where: { status: GiftCardStatus.ACTIVE } }),
      this.prisma.giftCard.count({
        where: { status: GiftCardStatus.REDEEMED },
      }),
      this.prisma.giftCard.count({ where: { status: GiftCardStatus.EXPIRED } }),
      this.prisma.giftCard.aggregate({
        _sum: { originalAmount: true },
      }),
      this.prisma.bookingGiftCard.aggregate({
        _sum: { amountUsed: true },
      }),
    ]);

    const redemptionRate =
      totalGiftCards > 0 ? (redeemedCards / totalGiftCards) * 100 : 0;

    return {
      totalGiftCards,
      activeCards,
      redeemedCards,
      expiredCards,
      totalPurchased: totalPurchased._sum.originalAmount || 0,
      totalRedeemed: totalRedeemed._sum.amountUsed || 0,
      redemptionRate: Math.round(redemptionRate * 10) / 10,
    };
  }
}
