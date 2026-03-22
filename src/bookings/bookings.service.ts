import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import {
  CreateBookingDto,
  CancelBookingDto,
  RejectBookingDto,
  RescheduleBookingDto,
} from './dto';
import { BookingStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private payments: PaymentsService,
  ) {}

  async create(userId: string, dto: CreateBookingDto) {
    // Verify experience exists and is published
    const experience = await this.prisma.experience.findUnique({
      where: { id: dto.experienceId },
      include: { host: true },
    });

    if (!experience || experience.deletedAt || experience.status !== 'PUBLISHED') {
      throw new NotFoundException('Experience not found or not available');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate < new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate guest count
    if (dto.guests < experience.minGuests || dto.guests > experience.maxGuests) {
      throw new BadRequestException(
        `Guest count must be between ${experience.minGuests} and ${experience.maxGuests}`,
      );
    }

    // Check availability and reserve slots
    const dateOnly = startDate.toISOString().split('T')[0];
    const timeOnly = dto.startTime || '00:00'; // Require startTime in DTO

    const availability = await this.prisma.availability.findUnique({
      where: {
        experienceId_date_startTime: {
          experienceId: dto.experienceId,
          date: new Date(dateOnly),
          startTime: timeOnly,
        },
      },
    });

    if (!availability) {
      throw new BadRequestException('No availability found for this date and time');
    }

    if (availability.isPaused) {
      throw new BadRequestException('This time slot is currently unavailable');
    }

    // Count existing bookings for this slot
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        experienceId: dto.experienceId,
        startDate: {
          gte: new Date(dateOnly + 'T00:00:00'),
          lt: new Date(dateOnly + 'T23:59:59'),
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.CONFIRMED],
        },
      },
    });

    const bookedSlots = existingBookings.reduce((sum, b) => sum + b.guests, 0);
    const availableSlots = availability.slots - bookedSlots;

    if (dto.guests > availableSlots) {
      throw new BadRequestException(
        `Only ${availableSlots} slot(s) available for this time. You requested ${dto.guests}.`,
      );
    }

    // Calculate total price (check for override price in availability)
    const pricePerGuest = availability.price ? Number(availability.price) : Number(experience.price);
    const totalPrice = pricePerGuest * dto.guests;

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        userId,
        experienceId: dto.experienceId,
        startDate,
        endDate,
        guests: dto.guests,
        totalPrice,
        currency: experience.currency,
        specialRequests: dto.specialRequests,
        status: BookingStatus.PENDING,
      },
      include: {
        user: true,
        experience: {
          include: { host: true },
        },
      },
    });

    // Notify host
    this.notifications.sendBookingCreated(booking);

    return booking;
  }

  async findAll(userId: string, userRole: string) {
    const where: any = {};

    if (userRole === 'HOST' || userRole === 'OWNER') {
      // Show bookings for experiences hosted by this user
      where.experience = {
        hostId: userId,
      };
    } else {
      // Show bookings made by this user
      where.userId = userId;
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        experience: {
          include: {
            host: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  async findOne(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        experience: {
          include: { host: true },
        },
        payment: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
        rescheduleRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check authorization
    const isOwner = booking.userId === userId;
    const isHost = booking.experience.hostId === userId;
    const isAdmin = userRole === 'OWNER';

    if (!isOwner && !isHost && !isAdmin) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async accept(id: string, hostId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        experience: { include: { host: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.experience.hostId !== hostId) {
      throw new ForbiddenException('You can only accept bookings for your own experiences');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be accepted');
    }

    // Check 24-hour window
    const hoursSinceCreation =
      (new Date().getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      throw new BadRequestException('24-hour acceptance window has expired');
    }

    // Update booking to ACCEPTED
    const accepted = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        user: true,
        experience: { include: { host: true } },
      },
    });

    // Notify user
    this.notifications.sendBookingAccepted(accepted);

    // Process payment (mocked)
    try {
      await this.payments.processPayment({
        bookingId: id,
        provider: PaymentProvider.STRIPE,
        amount: Number(booking.totalPrice),
        currency: booking.currency,
      });

      // Update booking to CONFIRMED after payment
      const confirmed = await this.prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: {
          user: true,
          experience: { include: { host: true } },
        },
      });

      this.notifications.sendPaymentConfirmed(confirmed);

      return confirmed;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return accepted;
    }
  }

  async reject(id: string, hostId: string, dto: RejectBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        experience: { include: { host: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.experience.hostId !== hostId) {
      throw new ForbiddenException('You can only reject bookings for your own experiences');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be rejected');
    }

    const rejected = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: {
        user: true,
        experience: { include: { host: true } },
      },
    });

    this.notifications.sendBookingRejected(rejected);

    return rejected;
  }

  async cancel(id: string, userId: string, userRole: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        experience: { include: { host: true } },
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check authorization
    const isOwner = booking.userId === userId;
    const isHost = booking.experience.hostId === userId;

    if (!isOwner && !isHost && userRole !== 'OWNER') {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    const cancellableStatuses: BookingStatus[] = [BookingStatus.ACCEPTED, BookingStatus.CONFIRMED];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException('Only accepted or confirmed bookings can be cancelled');
    }

    // Calculate refund
    const daysUntilExperience = Math.ceil(
      (booking.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    let refundPercentage = 0;
    if (daysUntilExperience > 7) {
      refundPercentage = 100;
    } else if (daysUntilExperience >= 3) {
      refundPercentage = 50;
    }

    const refundAmount = (Number(booking.totalPrice) * refundPercentage) / 100;

    // Update booking
    const cancelled = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
      include: {
        user: true,
        experience: { include: { host: true } },
        payment: true,
      },
    });

    // Process refund if applicable
    if (refundAmount > 0 && booking.payment) {
      await this.payments.refundPayment({
        paymentId: booking.payment.id,
        amount: refundAmount,
        reason: dto.reason,
      });

      await this.prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.REFUNDED },
      });
    }

    // Notify both parties
    const cancelledBy = isOwner ? 'USER' : 'HOST';
    this.notifications.sendBookingCancelled(cancelled, refundPercentage, cancelledBy);

    return {
      booking: cancelled,
      refundPercentage,
      refundAmount,
    };
  }

  // Cron job: Auto-reject bookings after 24 hours
  @Cron(CronExpression.EVERY_HOUR)
  async autoRejectExpiredBookings() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      include: {
        user: true,
        experience: { include: { host: true } },
      },
    });

    console.log(`⏰ Auto-rejecting ${expiredBookings.length} expired bookings...`);

    for (const booking of expiredBookings) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: 'Auto-rejected: 24-hour acceptance window expired',
        },
      });

      this.notifications.sendBookingRejected({
        ...booking,
        rejectionReason: 'Auto-rejected: 24-hour acceptance window expired',
      });
    }
  }

  private async generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    const paddedCount = String(count + 1).padStart(6, '0');
    return `CJ-${year}-${paddedCount}`;
  }
}
