import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { CollectionsModule } from './collections/collections.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled tasks (for 24h booking auto-reject)
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    }]),

    // Core modules
    PrismaModule,
    NotificationsModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ExperiencesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    MessagesModule,
    GiftCardsModule,
    CollectionsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
