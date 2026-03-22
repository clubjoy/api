import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { Role, GiftCardStatus } from '@prisma/client';
import { PurchaseGiftCardDto, ApplyGiftCardDto } from './dto';

@ApiTags('gift-cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a gift card' })
  async purchase(@Body() dto: PurchaseGiftCardDto, @Request() req) {
    return this.giftCardsService.purchase({
      ...dto,
      purchasedBy: req.user.userId,
    });
  }

  @Get('balance/:code')
  @ApiOperation({ summary: 'Check gift card balance (public)' })
  async checkBalance(@Param('code') code: string) {
    return this.giftCardsService.checkBalance(code);
  }

  @Get('my-cards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my purchased gift cards' })
  async getMyGiftCards(@Request() req) {
    return this.giftCardsService.getUserGiftCards(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all gift cards (Admin only)' })
  @ApiQuery({ name: 'status', enum: GiftCardStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('status') status?: GiftCardStatus,
    @Query('search') search?: string,
  ) {
    return this.giftCardsService.findAll({ status, search });
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gift card analytics (Admin only)' })
  async getAnalytics() {
    return this.giftCardsService.getAnalytics();
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a gift card (Admin only)' })
  async cancel(@Param('id') id: string) {
    return this.giftCardsService.cancel(id);
  }
}

// Booking-specific gift card endpoints
@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingGiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post(':id/apply-gift-card')
  @ApiOperation({ summary: 'Apply gift card to booking' })
  async applyGiftCard(
    @Param('id') bookingId: string,
    @Body() dto: ApplyGiftCardDto,
    @Request() req,
  ) {
    return this.giftCardsService.applyToBooking(
      bookingId,
      dto.code,
      req.user.userId,
    );
  }
}
