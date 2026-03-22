# ClubJoys Database Schema Overview

Visual overview of the complete database schema for the ClubJoys marketplace platform.

## Entity Relationship Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLUBJOYS DATABASE SCHEMA                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       User           │
├──────────────────────┤
│ id (PK)              │
│ email (unique)       │
│ passwordHash         │
│ role (USER/HOST/     │
│       OWNER)         │
│ firstName            │
│ lastName             │
│ avatar               │
│ phone                │
│ locale               │
│ bio                  │
│ createdAt            │
│ updatedAt            │
│ deletedAt            │
└──────────────────────┘
        │
        │ (1:N - hostedExperiences)
        ▼
┌──────────────────────┐
│    Experience        │
├──────────────────────┤
│ id (PK)              │
│ title                │
│ slug (unique)        │
│ description          │
│ price                │
│ currency             │
│ duration             │
│ maxGuests            │
│ minGuests            │
│ location             │
│ latitude             │
│ longitude            │
│ address              │
│ city                 │
│ country              │
│ images[]             │
│ coverImage           │
│ category             │
│ tags[]               │
│ status (DRAFT/       │
│   PENDING/PUBLISHED) │
│ hostId (FK → User)   │
│ submittedAt          │
│ approvedAt           │
│ approvedBy           │
│ rejectionReason      │
│ createdAt            │
│ updatedAt            │
│ deletedAt            │
└──────────────────────┘
        │
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│ ExperienceTranslation│  │    Availability      │
├──────────────────────┤  ├──────────────────────┤
│ id (PK)              │  │ id (PK)              │
│ experienceId (FK)    │  │ experienceId (FK)    │
│ language (en/it/     │  │ date                 │
│          es/de)      │  │ slots                │
│ title                │  │ price                │
│ description          │  │ createdAt            │
│ createdAt            │  │ updatedAt            │
│ updatedAt            │  └──────────────────────┘
└──────────────────────┘

┌──────────────────────┐
│      Booking         │
├──────────────────────┤
│ id (PK)              │
│ bookingNumber        │
│   (unique)           │
│ userId (FK → User)   │
│ experienceId (FK)    │
│ status (PENDING/     │
│   ACCEPTED/          │
│   CONFIRMED/etc)     │
│ startDate            │
│ endDate              │
│ guests               │
│ totalPrice           │
│ currency             │
│ specialRequests      │
│ createdAt            │
│ acceptedAt           │
│ rejectedAt           │
│ confirmedAt          │
│ cancelledAt          │
│ completedAt          │
│ cancellationReason   │
│ rejectionReason      │
└──────────────────────┘
        │
        ├─────────────────────────┬─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│      Payment         │  │      Message         │  │      Review          │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ id (PK)              │  │ id (PK)              │  │ id (PK)              │
│ bookingId (FK)       │  │ senderId (FK → User) │  │ userId (FK → User)   │
│   (unique 1:1)       │  │ bookingId (FK)       │  │ experienceId (FK)    │
│ provider (STRIPE/    │  │ content              │  │ bookingId (FK)       │
│   PAYPAL/SATISPAY)   │  │ read                 │  │   (unique 1:1)       │
│ amount               │  │ readAt               │  │ rating (1-5)         │
│ currency             │  │ createdAt            │  │ comment              │
│ status (PENDING/     │  └──────────────────────┘  │ hostResponse         │
│   PROCESSING/        │                            │ respondedAt          │
│   COMPLETED/etc)     │                            │ createdAt            │
│ transactionId        │                            │ updatedAt            │
│ paymentIntentId      │                            └──────────────────────┘
│ metadata (JSON)      │
│ refundedAt           │
│ refundReason         │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘

        ┌──────────────────────┐
        │  RescheduleRequest   │
        ├──────────────────────┤
        │ id (PK)              │
        │ bookingId (FK)       │
        │ oldDate              │
        │ newDate              │
        │ requestedBy          │
        │   (USER/HOST)        │
        │ reason               │
        │ status (PENDING/     │
        │   ACCEPTED/REJECTED) │
        │ rejectionReason      │
        │ createdAt            │
        │ resolvedAt           │
        └──────────────────────┘
```

## Enums

### Role
- `USER` - Regular customer
- `HOST` - Experience provider
- `OWNER` - Platform admin

### Language
- `en` - English
- `it` - Italian
- `es` - Spanish
- `de` - German

### ExperienceStatus
- `DRAFT` - Initial state
- `PENDING_APPROVAL` - Submitted for review
- `PUBLISHED` - Live and bookable
- `REJECTED` - Not approved
- `ARCHIVED` - No longer active

### BookingStatus
- `PENDING` - Awaiting host acceptance (24h window)
- `ACCEPTED` - Host accepted
- `REJECTED` - Host rejected or expired
- `CONFIRMED` - Payment completed
- `CANCELLED` - Cancelled by either party
- `COMPLETED` - Experience finished
- `REFUNDED` - Payment refunded

### PaymentProvider
- `STRIPE`
- `PAYPAL`
- `SATISPAY`

### PaymentStatus
- `PENDING` - Payment initiated
- `PROCESSING` - Being processed
- `COMPLETED` - Successful
- `FAILED` - Failed
- `REFUNDED` - Money returned

### RescheduleStatus
- `PENDING` - Awaiting approval
- `ACCEPTED` - Approved
- `REJECTED` - Declined

## Key Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Experience | 1:N | Host creates many experiences |
| Experience → ExperienceTranslation | 1:N | One translation per language |
| Experience → Availability | 1:N | Multiple date slots |
| Experience → Booking | 1:N | Can be booked multiple times |
| Experience → Review | 1:N | Receives multiple reviews |
| User → Booking | 1:N | User makes many bookings |
| Booking → Payment | 1:1 | One payment per booking |
| Booking → Message | 1:N | Conversation thread |
| Booking → Review | 1:1 | One review per booking |
| Booking → RescheduleRequest | 1:N | Multiple reschedule attempts |
| User → Message | 1:N | User sends many messages |
| User → Review | 1:N | User writes many reviews |

## Indexes Summary

### Single Column Indexes
- User: `email`, `role`
- Experience: `hostId`, `status`, `slug`, `category`
- Booking: `userId`, `experienceId`, `status`, `startDate`, `createdAt`
- Payment: `bookingId`, `status`, `transactionId`
- Message: `bookingId`, `senderId`, `createdAt`
- Review: `experienceId`, `rating`, `userId`
- Availability: `experienceId`, `date`
- RescheduleRequest: `bookingId`, `status`

### Composite Indexes
- Experience: `[status, latitude, longitude]` - Geographic search
- Booking: `[userId, status, startDate]` - User booking history
- Booking: `[status, experienceId, startDate]` - Host dashboard
- Message: `[bookingId, createdAt]` - Conversation threading
- Availability: `[experienceId, date]` - Date lookup
- ExperienceTranslation: `[experienceId, language]` - Unique constraint

## Unique Constraints

- User.email
- Experience.slug
- Booking.bookingNumber
- Payment.transactionId
- Payment.bookingId (1:1 relationship)
- Review.bookingId (1:1 relationship)
- ExperienceTranslation.[experienceId, language]
- Availability.[experienceId, date]

## Cascade Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| Experience | ExperienceTranslation | CASCADE |
| Experience | Availability | CASCADE |
| Booking | Message | CASCADE |

## Soft Delete Support

Models with `deletedAt` field:
- User
- Experience
- Booking (implicit)

Query pattern:
```typescript
where: { deletedAt: null }
```

## Database Size Estimates

Based on 1000 active experiences:
- **Users**: ~10,000 records (~2 MB)
- **Experiences**: ~1,000 records (~5 MB)
- **ExperienceTranslations**: ~4,000 records (~10 MB)
- **Bookings**: ~50,000/year (~25 MB/year)
- **Reviews**: ~30,000/year (~15 MB/year)
- **Messages**: ~200,000/year (~50 MB/year)
- **Availability**: ~365,000 records (~20 MB)

**Total (Year 1)**: ~127 MB
**Growth**: ~90 MB/year

PostgreSQL handles this easily. Optimize with:
- Regular VACUUM
- Index maintenance
- Archiving old bookings
