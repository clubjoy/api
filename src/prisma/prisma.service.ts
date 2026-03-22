import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to PostgreSQL database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Disconnected from PostgreSQL database');
  }

  /**
   * Soft delete helper
   */
  async softDelete(model: string, id: string) {
    return this[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Find many excluding soft deleted
   */
  async findManyActive(model: string, args?: any) {
    return this[model].findMany({
      ...args,
      where: {
        ...args?.where,
        deletedAt: null,
      },
    });
  }
}
