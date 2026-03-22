import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || Role.USER,
        phone: dto.phone,
        avatar: dto.avatar,
        bio: dto.bio,
        locale: dto.locale || 'en',
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll(role?: Role) {
    const where: any = { deletedAt: null };
    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        hostedExperiences: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            coverImage: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    return this.sanitizeUser(updated);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User successfully deleted' };
  }

  // Host Management Features
  async blockHost(id: string, blockedBy: string, reason: string) {
    const user = await this.findOne(id);

    if (user.role !== Role.HOST) {
      throw new ConflictException('Only hosts can be blocked');
    }

    if (user.isBlocked) {
      throw new ConflictException('Host is already blocked');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy,
      },
    });

    return this.sanitizeUser(updated);
  }

  async unblockHost(id: string) {
    const user = await this.findOne(id);

    if (!user.isBlocked) {
      throw new ConflictException('Host is not blocked');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
      },
    });

    return this.sanitizeUser(updated);
  }

  async toggleProfileVisibility(id: string, isPublic: boolean) {
    const user = await this.findOne(id);

    if (user.role !== Role.HOST) {
      throw new ConflictException('Only hosts have profile visibility settings');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isProfilePublic: isPublic },
    });

    return this.sanitizeUser(updated);
  }

  async createHost(dto: CreateUserDto, createdBy: string) {
    // Force role to be HOST
    const hostDto = { ...dto, role: Role.HOST };

    const host = await this.create(hostDto);

    // Log host creation
    console.log(`[HOST_MANAGEMENT] Host created by ${createdBy}:`, {
      hostId: host.id,
      email: host.email,
      createdBy,
    });

    return host;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
