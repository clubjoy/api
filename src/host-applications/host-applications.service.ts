import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateHostApplicationDto } from './dto';

@Injectable()
export class HostApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateHostApplicationDto) {
    const application = await this.prisma.hostApplication.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        postalCode: dto.postalCode,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        workshopsOffered: dto.workshopsOffered,
        daysAndHours: dto.daysAndHours,
        locale: dto.locale || 'en',
      },
    });

    // Send notification email to owner (mocked for now)
    // In production, this would send an actual email
    try {
      await this.notifications.sendEmail({
        to: process.env.OWNER_EMAIL || 'owner@clubjoys.com',
        subject: 'New Host Application Received',
        template: 'host-application',
        context: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          companyName: dto.companyName,
          workshopsOffered: dto.workshopsOffered,
          daysAndHours: dto.daysAndHours,
          applicationId: application.id,
        },
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error('Failed to send notification email:', error);
    }

    return {
      id: application.id,
      message: 'Application submitted successfully',
    };
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.hostApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.hostApplication.findUnique({
      where: { id },
    });
  }
}
