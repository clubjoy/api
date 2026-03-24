import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private stripe: StripeService,
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
      // In development, you might want to skip verification
      // In production, this should throw an error
    }

    let event: Stripe.Event;

    try {
      // Get raw body
      const rawBody = req.rawBody;

      if (!rawBody) {
        throw new BadRequestException('Missing raw body');
      }

      // Verify webhook signature
      if (webhookSecret) {
        event = this.stripe.verifyWebhookSignature(rawBody, signature, webhookSecret);
      } else {
        // Parse without verification (development only)
        event = JSON.parse(rawBody.toString());
      }
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw error;
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    try {
      await this.payments.handlePaymentSuccess(paymentIntent.id);
    } catch (error) {
      this.logger.error(
        `Failed to handle payment success for ${paymentIntent.id}: ${error.message}`,
      );
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);

    // Update payment status to FAILED
    const payment = await this.payments.findByPaymentIntentId(paymentIntent.id);

    if (payment) {
      await this.payments.updatePaymentStatus(payment.id, 'FAILED', {
        failureReason: paymentIntent.last_payment_error?.message,
      });
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent canceled: ${paymentIntent.id}`);

    // Update payment status to FAILED
    const payment = await this.payments.findByPaymentIntentId(paymentIntent.id);

    if (payment) {
      await this.payments.updatePaymentStatus(payment.id, 'FAILED', {
        cancellationReason: paymentIntent.cancellation_reason,
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);

    // The refund is already handled in the payments service
    // This is just for logging and additional processing if needed
  }
}
