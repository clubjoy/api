import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
  SearchExperiencesDto,
  RejectExperienceDto,
  SortBy,
} from './dto';
import { ExperienceStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class ExperiencesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(hostId: string, dto: CreateExperienceDto) {
    // Generate slug from title
    const slug = this.generateSlug(dto.title);

    // Get user to check role
    const user = await this.prisma.user.findUnique({
      where: { id: hostId },
    });

    // OWNER role gets auto-approved to PUBLISHED, others start as DRAFT
    const status = user?.role === 'OWNER' ? ExperienceStatus.PUBLISHED : ExperienceStatus.DRAFT;
    const approvedAt = user?.role === 'OWNER' ? new Date() : null;
    const approvedBy = user?.role === 'OWNER' ? hostId : null;

    // Calculate maxGuests from availability if not provided
    let maxGuests = dto.maxGuests || 1;
    let minGuests = 1;

    if (dto.availability && dto.availability.length > 0) {
      const maxSlots = Math.max(...dto.availability.map(slot => slot.slots));
      maxGuests = dto.maxGuests || maxSlots;
      minGuests = 1;
    }

    const experience = await this.prisma.experience.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'EUR',
        duration: dto.duration,
        maxGuests,
        minGuests,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        images: dto.images,
        coverImage: dto.coverImage || dto.images[0],
        category: dto.category,
        tags: dto.tags || [],
        hostId,
        status,
        approvedAt,
        approvedBy,
      },
      include: {
        host: true,
      },
    });

    // Create availability slots if provided
    if (dto.availability && dto.availability.length > 0) {
      await this.prisma.availability.createMany({
        data: dto.availability.map(slot => ({
          experienceId: experience.id,
          date: slot.date ? new Date(slot.date) : new Date(), // Default to today if recurring
          startTime: slot.startTime,
          slots: slot.slots,
          price: slot.price,
          isRecurring: slot.isRecurring || false,
          recurringDays: slot.recurringDays || [],
          recurringUntil: slot.recurringUntil ? new Date(slot.recurringUntil) : null,
          isPaused: slot.isPaused || false,
        })),
      });
    }

    return experience;
  }

  async findAll(params: SearchExperiencesDto & { hostId?: string; status?: ExperienceStatus }) {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      radius,
      sortBy = SortBy.POPULAR,
      page = 1,
      limit = 20,
      hostId,
      status,
    } = params;

    const where: any = {
      deletedAt: null,
    };

    // Status filter (default to PUBLISHED for public search)
    if (status) {
      where.status = status;
    } else if (!hostId) {
      where.status = ExperienceStatus.PUBLISHED;
    }

    // Host filter
    if (hostId) {
      where.hostId = hostId;
    }

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Location-based search (simplified - for production use PostGIS)
    if (latitude && longitude && radius) {
      const latDelta = radius / 111; // rough km to degrees
      const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

      where.latitude = {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      };
      where.longitude = {
        gte: longitude - lngDelta,
        lte: longitude + lngDelta,
      };
    }

    // Sorting
    let orderBy: any;
    switch (sortBy) {
      case SortBy.PRICE_ASC:
        orderBy = { price: 'asc' };
        break;
      case SortBy.PRICE_DESC:
        orderBy = { price: 'desc' };
        break;
      case SortBy.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case SortBy.RATING:
      case SortBy.POPULAR:
      default:
        orderBy = { createdAt: 'desc' }; // Simplified
    }

    const [experiences, total] = await Promise.all([
      this.prisma.experience.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
      }),
      this.prisma.experience.count({ where }),
    ]);

    // Calculate average rating
    const enriched = experiences.map((exp) => ({
      ...exp,
      averageRating:
        exp.reviews.length > 0
          ? exp.reviews.reduce((sum, r) => sum + r.rating, 0) / exp.reviews.length
          : null,
      reviewCount: exp.reviews.length,
    }));

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { slug },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
        reviews: {
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
        },
        availability: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 30,
        },
      },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    // Calculate average rating
    const averageRating =
      experience.reviews.length > 0
        ? experience.reviews.reduce((sum, r) => sum + r.rating, 0) / experience.reviews.length
        : null;

    return {
      ...experience,
      averageRating,
      reviewCount: experience.reviews.length,
    };
  }

  async findOne(id: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
        reviews: {
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
        },
        availability: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 30,
        },
      },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    // Calculate average rating
    const averageRating =
      experience.reviews.length > 0
        ? experience.reviews.reduce((sum, r) => sum + r.rating, 0) / experience.reviews.length
        : null;

    return {
      ...experience,
      averageRating,
      reviewCount: experience.reviews.length,
    };
  }

  async update(id: string, hostId: string, dto: UpdateExperienceDto) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You can only edit your own experiences');
    }

    // Get user to check role
    const user = await this.prisma.user.findUnique({
      where: { id: hostId },
    });

    // If HOST edits a PUBLISHED experience, send it back to PENDING_APPROVAL with change tracking
    let newStatus = experience.status;
    let changeLog = null;

    if (user?.role === 'HOST' && experience.status === ExperienceStatus.PUBLISHED) {
      newStatus = ExperienceStatus.PENDING_APPROVAL;

      // Track what changed
      const changes: any = {};
      Object.keys(dto).forEach(key => {
        if (dto[key] !== undefined && JSON.stringify(experience[key]) !== JSON.stringify(dto[key])) {
          changes[key] = {
            old: experience[key],
            new: dto[key],
          };
        }
      });

      changeLog = {
        changes,
        editedAt: new Date(),
        editedBy: hostId,
      };
    }

    const updated = await this.prisma.experience.update({
      where: { id },
      data: {
        ...dto,
        coverImage: dto.coverImage || dto.images?.[0],
        status: newStatus,
        changeLog: changeLog || experience.changeLog,
        submittedAt: newStatus === ExperienceStatus.PENDING_APPROVAL ? new Date() : experience.submittedAt,
      },
      include: { host: true },
    });

    // Notify admin if experience needs re-approval
    if (newStatus === ExperienceStatus.PENDING_APPROVAL && experience.status === ExperienceStatus.PUBLISHED) {
      this.notifications.sendExperienceSubmitted(updated);
    }

    return updated;
  }

  async submitForApproval(id: string, hostId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You can only submit your own experiences');
    }

    const allowedSubmitStatuses: ExperienceStatus[] = [ExperienceStatus.DRAFT, ExperienceStatus.REJECTED];
    if (!allowedSubmitStatuses.includes(experience.status)) {
      throw new BadRequestException('Only draft or rejected experiences can be submitted');
    }

    // Validate completeness
    this.validateExperienceComplete(experience);

    const updated = await this.prisma.experience.update({
      where: { id },
      data: {
        status: ExperienceStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
      },
      include: { host: true },
    });

    // Notify admin
    this.notifications.sendExperienceSubmitted(updated);

    return updated;
  }

  async approve(id: string, ownerId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.status !== ExperienceStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending experiences can be approved');
    }

    const updated = await this.prisma.experience.update({
      where: { id },
      data: {
        status: ExperienceStatus.PUBLISHED,
        approvedAt: new Date(),
        approvedBy: ownerId,
        changeLog: null, // Clear change log after approval
      },
      include: { host: true },
    });

    // Notify host
    this.notifications.sendExperienceApproved(updated);

    return updated;
  }

  async reject(id: string, ownerId: string, dto: RejectExperienceDto) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.status !== ExperienceStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending experiences can be rejected');
    }

    const updated = await this.prisma.experience.update({
      where: { id },
      data: {
        status: ExperienceStatus.REJECTED,
        rejectionReason: dto.reason,
      },
      include: { host: true },
    });

    // Notify host
    this.notifications.sendExperienceRejected(updated, dto.reason);

    return updated;
  }

  async remove(id: string, hostId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You can only delete your own experiences');
    }

    await this.prisma.experience.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Experience successfully deleted' };
  }

  private validateExperienceComplete(experience: any) {
    const errors = [];

    if (!experience.title) errors.push('Title is required');
    if (!experience.description) errors.push('Description is required');
    if (!experience.price) errors.push('Price is required');
    if (!experience.duration) errors.push('Duration is required');
    if (!experience.maxGuests) errors.push('Max guests is required');
    if (!experience.location) errors.push('Location is required');
    if (!experience.images || experience.images.length === 0) {
      errors.push('At least one image is required');
    }
    if (!experience.category) errors.push('Category is required');

    if (errors.length > 0) {
      throw new BadRequestException(`Experience incomplete: ${errors.join(', ')}`);
    }
  }

  async getAllAvailability(experienceId: string) {
    const slots = await this.prisma.availability.findMany({
      where: {
        experienceId,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return slots;
  }

  async updateAvailability(experienceId: string, hostId: string, availability: any[]) {
    // Verify ownership
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    if (experience.hostId !== hostId) {
      throw new ForbiddenException('You can only edit your own experiences');
    }

    // Delete all existing availability slots
    await this.prisma.availability.deleteMany({
      where: { experienceId },
    });

    // Create new availability slots
    if (availability && availability.length > 0) {
      await this.prisma.availability.createMany({
        data: availability.map((slot, index) => ({
          experienceId,
          // For recurring patterns without a specific date, use a far future date + index to avoid conflicts
          date: slot.date ? new Date(slot.date) : new Date(2099, 0, 1 + index),
          startTime: slot.startTime,
          slots: slot.slots,
          price: slot.price ? parseFloat(slot.price.toString()) : null,
          isRecurring: slot.isRecurring || false,
          recurringDays: slot.recurringDays || slot.days || [],
          recurringUntil: slot.recurringUntil ? new Date(slot.recurringUntil) : null,
          isPaused: slot.isPaused || false,
        })),
      });
    }

    return this.getAllAvailability(experienceId);
  }

  async getAvailability(experienceId: string, dateString: string) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.

    // Get all availability slots for this date
    const specificSlots = await this.prisma.availability.findMany({
      where: {
        experienceId,
        date,
        isPaused: false,
      },
    });

    // Get recurring patterns that match this day
    const recurringSlots = await this.prisma.availability.findMany({
      where: {
        experienceId,
        isRecurring: true,
        isPaused: false,
        recurringDays: {
          has: dayOfWeek,
        },
        OR: [
          { recurringUntil: null },
          { recurringUntil: { gte: date } },
        ],
      },
    });

    // Get all bookings for this date
    const bookings = await this.prisma.booking.findMany({
      where: {
        experienceId,
        startDate: {
          gte: new Date(dateString + 'T00:00:00'),
          lt: new Date(dateString + 'T23:59:59'),
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.CONFIRMED],
        },
      },
    });

    // Combine specific and recurring slots
    const allSlots = [...specificSlots, ...recurringSlots];

    // Calculate available slots for each time
    const availability = allSlots.map(slot => {
      const bookedForThisTime = bookings
        .filter(b => {
          // Assuming booking has startTime stored or we extract from startDate
          const bookingTime = new Date(b.startDate).toTimeString().substring(0, 5);
          return bookingTime === slot.startTime;
        })
        .reduce((sum, b) => sum + b.guests, 0);

      return {
        id: slot.id,
        startTime: slot.startTime,
        totalSlots: slot.slots,
        availableSlots: slot.slots - bookedForThisTime,
        price: slot.price,
        isPaused: slot.isPaused,
        isRecurring: slot.isRecurring,
      };
    });

    return availability.filter(a => a.availableSlots > 0);
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 8)
    );
  }
}
