import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async send(bookingId: string, senderId: string, dto: SendMessageDto) {
    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
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

    // Verify sender is either the user or the host
    const isUser = booking.userId === senderId;
    const isHost = booking.experience.hostId === senderId;

    if (!isUser && !isHost) {
      throw new ForbiddenException('You can only send messages for your own bookings');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        bookingId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
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

    // Notify recipient
    this.notifications.sendNewMessage(message);

    return message;
  }

  async findByBooking(bookingId: string, userId: string) {
    // Verify access to booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { experience: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isUser = booking.userId === userId;
    const isHost = booking.experience.hostId === userId;

    if (!isUser && !isHost) {
      throw new ForbiddenException('You do not have access to these messages');
    }

    const messages = await this.prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        booking: {
          include: { experience: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Can only mark as read if you're the recipient
    const isRecipient =
      (message.booking.userId === userId && message.senderId !== userId) ||
      (message.booking.experience.hostId === userId && message.senderId !== userId);

    if (!isRecipient) {
      throw new ForbiddenException('You can only mark messages addressed to you as read');
    }

    if (message.read) {
      throw new BadRequestException('Message already marked as read');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return updated;
  }
}
