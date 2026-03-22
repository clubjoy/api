import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  // Booking notifications
  sendBookingCreated(booking: any) {
    console.log(`
📧 ===== EMAIL NOTIFICATION =====
To: ${booking.experience?.host?.email || 'host@example.com'}
Subject: New Booking Request - ${booking.bookingNumber}

Hi ${booking.experience?.host?.firstName || 'Host'},

You have a new booking request!

Booking Details:
- Booking #: ${booking.bookingNumber}
- Experience: ${booking.experience?.title || 'N/A'}
- Guest: ${booking.user?.firstName} ${booking.user?.lastName}
- Date: ${booking.startDate}
- Guests: ${booking.guests}
- Total: ${booking.currency} ${booking.totalPrice}

⏰ Please accept or reject within 24 hours!

View booking: ${process.env.APP_URL}/host/bookings/${booking.id}

Best regards,
ClubJoys Team
================================
    `);
  }

  sendBookingAccepted(booking: any) {
    console.log(`
📧 ✅ ===== EMAIL NOTIFICATION =====
To: ${booking.user?.email || 'user@example.com'}
Subject: Booking Accepted - ${booking.bookingNumber}

Hi ${booking.user?.firstName || 'Guest'},

Great news! Your booking has been accepted!

Booking Details:
- Booking #: ${booking.bookingNumber}
- Experience: ${booking.experience?.title || 'N/A'}
- Date: ${booking.startDate}
- Guests: ${booking.guests}
- Total: ${booking.currency} ${booking.totalPrice}

Your payment has been processed and the booking is confirmed.

View booking: ${process.env.APP_URL}/bookings/${booking.id}

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendBookingRejected(booking: any) {
    console.log(`
📧 ❌ ===== EMAIL NOTIFICATION =====
To: ${booking.user?.email || 'user@example.com'}
Subject: Booking Update - ${booking.bookingNumber}

Hi ${booking.user?.firstName || 'Guest'},

Unfortunately, your booking request could not be accepted.

Booking Details:
- Booking #: ${booking.bookingNumber}
- Experience: ${booking.experience?.title || 'N/A'}
- Date: ${booking.startDate}
${booking.rejectionReason ? `- Reason: ${booking.rejectionReason}` : ''}

No charges have been made to your account.

Browse other experiences: ${process.env.APP_URL}/experiences

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendBookingReminder(booking: any) {
    console.log(`
📧 ⏰ ===== EMAIL NOTIFICATION =====
To: ${booking.user?.email || 'user@example.com'}
Subject: Reminder: Upcoming Experience Tomorrow

Hi ${booking.user?.firstName || 'Guest'},

Your experience is coming up tomorrow!

Booking Details:
- Experience: ${booking.experience?.title || 'N/A'}
- Date: ${booking.startDate}
- Location: ${booking.experience?.location || 'N/A'}
- Guests: ${booking.guests}

View details: ${process.env.APP_URL}/bookings/${booking.id}

Have a great time!
ClubJoys Team
====================================
    `);
  }

  sendBookingCancelled(booking: any, refundPercentage: number, cancelledBy: string) {
    const recipient = cancelledBy === 'USER' ? booking.experience?.host : booking.user;
    console.log(`
📧 ⚠️  ===== EMAIL NOTIFICATION =====
To: ${recipient?.email || 'email@example.com'}
Subject: Booking Cancelled - ${booking.bookingNumber}

Hi ${recipient?.firstName || 'there'},

A booking has been cancelled.

Booking Details:
- Booking #: ${booking.bookingNumber}
- Experience: ${booking.experience?.title || 'N/A'}
- Date: ${booking.startDate}
- Cancelled by: ${cancelledBy}
${booking.cancellationReason ? `- Reason: ${booking.cancellationReason}` : ''}
${refundPercentage > 0 ? `- Refund: ${refundPercentage}% (${booking.currency} ${(booking.totalPrice * refundPercentage / 100).toFixed(2)})` : ''}

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendPaymentConfirmed(booking: any) {
    console.log(`
📧 💳 ===== EMAIL NOTIFICATION =====
To: ${booking.user?.email || 'user@example.com'}
Subject: Payment Confirmed - ${booking.bookingNumber}

Hi ${booking.user?.firstName || 'Guest'},

Your payment has been successfully processed!

Payment Details:
- Amount: ${booking.currency} ${booking.totalPrice}
- Booking #: ${booking.bookingNumber}
- Experience: ${booking.experience?.title || 'N/A'}

Receipt: ${process.env.APP_URL}/bookings/${booking.id}/receipt

Best regards,
ClubJoys Team
====================================
    `);
  }

  // Experience notifications
  sendExperienceApproved(experience: any) {
    console.log(`
📧 ✅ ===== EMAIL NOTIFICATION =====
To: ${experience.host?.email || 'host@example.com'}
Subject: Experience Approved - ${experience.title}

Hi ${experience.host?.firstName || 'Host'},

Congratulations! Your experience has been approved and is now live!

Experience: ${experience.title}
View: ${process.env.APP_URL}/experiences/${experience.slug}

Start receiving bookings now!

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendExperienceRejected(experience: any, reason: string) {
    console.log(`
📧 ❌ ===== EMAIL NOTIFICATION =====
To: ${experience.host?.email || 'host@example.com'}
Subject: Experience Needs Revision - ${experience.title}

Hi ${experience.host?.firstName || 'Host'},

Your experience submission needs some revisions before it can be approved.

Experience: ${experience.title}
Reason: ${reason}

Please make the necessary changes and resubmit.

Edit experience: ${process.env.APP_URL}/host/experiences/${experience.id}/edit

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendExperienceSubmitted(experience: any) {
    console.log(`
📧 📝 ===== EMAIL NOTIFICATION =====
To: admin@clubjoys.com
Subject: New Experience Submission - ${experience.title}

New experience submitted for review:

- Title: ${experience.title}
- Host: ${experience.host?.firstName} ${experience.host?.lastName}
- Category: ${experience.category}
- Price: ${experience.currency} ${experience.price}

Review: ${process.env.APP_URL}/admin/experiences/${experience.id}

ClubJoys Admin
====================================
    `);
  }

  // Message notifications
  sendNewMessage(message: any) {
    const recipient = message.booking?.userId === message.senderId
      ? message.booking?.experience?.host
      : message.booking?.user;

    console.log(`
📧 💬 ===== EMAIL NOTIFICATION =====
To: ${recipient?.email || 'email@example.com'}
Subject: New Message - Booking ${message.booking?.bookingNumber}

Hi ${recipient?.firstName || 'there'},

You have a new message regarding your booking.

From: ${message.sender?.firstName} ${message.sender?.lastName}
Booking: ${message.booking?.bookingNumber}

"${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"

Reply: ${process.env.APP_URL}/bookings/${message.bookingId}/messages

Best regards,
ClubJoys Team
====================================
    `);
  }

  // Review notifications
  sendReviewReceived(review: any) {
    console.log(`
📧 ⭐ ===== EMAIL NOTIFICATION =====
To: ${review.experience?.host?.email || 'host@example.com'}
Subject: New Review - ${review.experience?.title}

Hi ${review.experience?.host?.firstName || 'Host'},

You received a new review!

Experience: ${review.experience?.title}
Rating: ${'⭐'.repeat(review.rating)} (${review.rating}/5)
Comment: "${review.comment || 'No comment'}"

Respond to review: ${process.env.APP_URL}/host/reviews/${review.id}

Best regards,
ClubJoys Team
====================================
    `);
  }

  sendHostResponse(review: any) {
    console.log(`
📧 💬 ===== EMAIL NOTIFICATION =====
To: ${review.user?.email || 'user@example.com'}
Subject: Host Responded to Your Review

Hi ${review.user?.firstName || 'Guest'},

The host has responded to your review!

Experience: ${review.experience?.title}
Host response: "${review.hostResponse || 'No response'}"

View: ${process.env.APP_URL}/experiences/${review.experience?.slug}#reviews

Best regards,
ClubJoys Team
====================================
    `);
  }

  // Reschedule notifications
  sendRescheduleRequest(booking: any, newDate: Date, recipientRole: string) {
    const recipient = recipientRole === 'HOST' ? booking.experience?.host : booking.user;
    console.log(`
📧 🔄 ===== EMAIL NOTIFICATION =====
To: ${recipient?.email || 'email@example.com'}
Subject: Reschedule Request - ${booking.bookingNumber}

Hi ${recipient?.firstName || 'there'},

A reschedule request has been made for your booking.

Current Date: ${booking.startDate}
Proposed Date: ${newDate}

Please accept or reject this request.

View: ${process.env.APP_URL}/bookings/${booking.id}

Best regards,
ClubJoys Team
====================================
    `);
  }
}
