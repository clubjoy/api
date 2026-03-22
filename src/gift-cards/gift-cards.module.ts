import { Module } from '@nestjs/common';
import {
  GiftCardsController,
  BookingGiftCardsController,
} from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GiftCardsController, BookingGiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
