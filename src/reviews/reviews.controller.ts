import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondReviewDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:bookingId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed booking (USER only)' })
  create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(bookingId, user.id, dto);
  }

  @Get('experiences/:experienceId/reviews')
  @ApiOperation({ summary: 'Get all reviews for an experience' })
  findByExperience(@Param('experienceId') experienceId: string) {
    return this.reviewsService.findByExperience(experienceId);
  }

  @Post('reviews/:id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review (HOST only)' })
  respond(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RespondReviewDto,
  ) {
    return this.reviewsService.respond(id, user.id, dto);
  }
}
