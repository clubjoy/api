import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto, RespondReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(bookingId: string, userId: string, dto: CreateReviewDto) {
    // Verify booking exists and is completed
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        experience: {
          include: { host: true },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user owns the booking
    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    // Verify booking is completed
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    // Check if review already exists
    if (booking.review) {
      throw new BadRequestException('This booking has already been reviewed');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        userId,
        experienceId: booking.experienceId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        experience: {
          include: { host: true },
        },
      },
    });

    // Notify host
    this.notifications.sendReviewReceived(review);

    return review;
  }

  async findByExperience(experienceId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { experienceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async respond(reviewId: string, hostId: string, dto: RespondReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        experience: {
          include: { host: true },
        },
        user: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify host owns the experience
    if (review.experience.hostId !== hostId) {
      throw new ForbiddenException('You can only respond to reviews for your own experiences');
    }

    // Check if already responded
    if (review.hostResponse) {
      throw new BadRequestException('You have already responded to this review');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostResponse: dto.hostResponse,
        respondedAt: new Date(),
      },
      include: {
        experience: {
          include: { host: true },
        },
        user: true,
      },
    });

    // Notify user
    this.notifications.sendHostResponse(updated);

    return updated;
  }
}
