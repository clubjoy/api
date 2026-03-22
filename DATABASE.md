# ClubJoys Database Architecture

## Overview

The ClubJoys database is designed for a marketplace platform connecting users with unique local experiences. Built on PostgreSQL 14+ with Prisma ORM for type-safe database access.

## Key Design Principles

1. **Normalized Schema**: Minimize data duplication
2. **Performance**: Strategic indexes on high-traffic queries
3. **Data Integrity**: Foreign keys, unique constraints, check constraints
4. **Audit Trail**: Created/updated timestamps on all models
5. **Soft Deletes**: Retain data with `deletedAt` for compliance
6. **Multi-language**: i18n support through translation tables

## Database Models

### User Management

#### User
Core user model supporting three roles:
- **USER**: Regular customers who book experiences
- **HOST**: Experience providers who create and manage listings
- **OWNER**: Platform administrators with full access

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  firstName    String
  lastName     String
  avatar       String?
  phone        String?
  locale       String   @default("en")
  bio          String?

  // Timestamps & soft delete
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}
```

**Indexes**:
- `email` - Fast login lookups
- `role` - Filter users by role

### Experience Management

#### Experience
Core listing model for bookable experiences.

**Status Workflow**:
```
DRAFT → PENDING_APPROVAL → PUBLISHED
                         ↓
                     REJECTED
```

**Key Features**:
- Geographic search (latitude/longitude indexes)
- Category-based filtering
- Multi-image support (array of URLs)
- Price with currency support
- Min/max guest capacity
- Duration in minutes

**Approval System**:
- Hosts submit experiences (`PENDING_APPROVAL`)
- Owners review and approve/reject
- Tracks `approvedBy` and `approvedAt`
- Rejection reason for transparency

#### ExperienceTranslation
Multi-language support for experiences.

**Supported Languages**: en, it, es, de

Unique constraint on `[experienceId, language]` ensures one translation per language.

### Booking System

#### Booking
Core booking model with sophisticated status workflow.

**Status Flow**:
```
PENDING → ACCEPTED → CONFIRMED → COMPLETED
   ↓          ↓          ↓
REJECTED  CANCELLED  CANCELLED
   ↓          ↓
REFUNDED  REFUNDED
```

**24-Hour Acceptance Window**:
- Bookings start in `PENDING` status
- Hosts have 24 hours from `createdAt` to accept
- Auto-reject scheduled task changes `PENDING` → `REJECTED` after 24h
- Track `acceptedAt` to enforce window

**Key Fields**:
- `bookingNumber`: Human-readable ID (e.g., "CJ-2026-000001")
- `startDate`/`endDate`: Experience time window
- `guests`: Number of participants
- `totalPrice`: Final price (can differ from base price)
- `specialRequests`: User notes for host

**Cancellation**:
- Either party can cancel
- `cancellationReason` stores explanation
- Triggers refund process

### Payment Processing

#### Payment
Payment transaction records.

**Providers**: Stripe, PayPal, Satispay (mocked in development)

**Status Flow**:
```
PENDING → PROCESSING → COMPLETED
   ↓          ↓
FAILED    FAILED
   ↓
REFUNDED
```

One-to-one relationship with Booking (one payment per booking).

**Key Fields**:
- `transactionId`: Provider's transaction ID (unique)
- `paymentIntentId`: Stripe Payment Intent ID
- `metadata`: JSON field for provider-specific data
- `refundedAt`/`refundReason`: Track refunds

### Communication

#### Message
Real-time messaging between users and hosts.

**Features**:
- Scoped to specific booking
- Read receipts (`read`, `readAt`)
- Chronological ordering (indexed on `createdAt`)
- Cascade delete when booking deleted

**Query Pattern**:
```typescript
// Get conversation for a booking
const messages = await prisma.message.findMany({
  where: { bookingId },
  orderBy: { createdAt: 'asc' },
  include: { sender: true },
})
```

### Review System

#### Review
Post-experience ratings and feedback.

**Constraints**:
- One review per booking (unique constraint)
- Rating: 1-5 stars
- Optional comment
- Host can respond (stores `hostResponse` and `respondedAt`)

**Query Pattern**:
```typescript
// Get experience average rating
const stats = await prisma.review.aggregate({
  where: { experienceId },
  _avg: { rating: true },
  _count: true,
})
```

### Availability Management

#### Availability
Calendar-based slot management.

**Features**:
- Date-specific availability
- Slot capacity per date
- Optional price override
- Unique constraint on `[experienceId, date]`

**Query Pattern**:
```typescript
// Find available dates
const available = await prisma.availability.findMany({
  where: {
    experienceId,
    date: { gte: new Date() },
    slots: { gt: 0 },
  },
})
```

#### RescheduleRequest
Booking date change requests.

**Status Flow**:
```
PENDING → ACCEPTED
   ↓
REJECTED
```

**Features**:
- Either party can request (`requestedBy`: USER/HOST)
- Stores old and new dates
- Optional reason and rejection reason

## Indexing Strategy

### Single Column Indexes
- **Users**: `email`, `role`
- **Experiences**: `hostId`, `status`, `slug`, `category`
- **Bookings**: `userId`, `experienceId`, `status`, `startDate`, `createdAt`
- **Payments**: `bookingId`, `status`, `transactionId`
- **Messages**: `bookingId`, `senderId`, `createdAt`
- **Reviews**: `experienceId`, `rating`, `userId`

### Composite Indexes
Optimized for common query patterns:

```prisma
// Geographic search
@@index([status, latitude, longitude])

// Host's bookings dashboard
@@index([status, experienceId, startDate])

// User's booking history
@@index([userId, status, startDate])

// Message threading
@@index([bookingId, createdAt])

// Availability lookup
@@index([experienceId, date])
```

## Query Patterns

### Find Available Experiences Near Location
```typescript
const experiences = await prisma.experience.findMany({
  where: {
    status: 'PUBLISHED',
    deletedAt: null,
    latitude: {
      gte: minLat,
      lte: maxLat,
    },
    longitude: {
      gte: minLng,
      lte: maxLng,
    },
  },
  include: {
    host: true,
    reviews: {
      select: { rating: true },
    },
  },
})
```

### Find Bookings Needing Auto-Rejection
```typescript
const expiredBookings = await prisma.booking.findMany({
  where: {
    status: 'PENDING',
    createdAt: {
      lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
})
```

### Get Experience with Translations
```typescript
const experience = await prisma.experience.findUnique({
  where: { id },
  include: {
    translations: {
      where: { language: userLocale },
    },
    host: {
      select: {
        id: true,
        firstName: true,
        avatar: true,
      },
    },
  },
})
```

### Calculate Host's Booking Statistics
```typescript
const stats = await prisma.booking.groupBy({
  by: ['status'],
  where: {
    experience: { hostId },
    createdAt: { gte: startDate },
  },
  _count: true,
  _sum: { totalPrice: true },
})
```

## Data Integrity

### Cascading Deletes
- `ExperienceTranslation` → cascades when `Experience` deleted
- `Availability` → cascades when `Experience` deleted
- `Message` → cascades when `Booking` deleted

### Foreign Key Constraints
All relationships enforce referential integrity:
- Bookings cannot exist without valid User and Experience
- Payments cannot exist without valid Booking
- Reviews cannot exist without valid Booking

### Unique Constraints
- `User.email` - One account per email
- `Experience.slug` - Unique URL slugs
- `Booking.bookingNumber` - Unique booking IDs
- `Payment.transactionId` - Prevent duplicate transactions
- `ExperienceTranslation.[experienceId, language]` - One translation per language
- `Review.bookingId` - One review per booking
- `Availability.[experienceId, date]` - One availability record per date

## Soft Deletes

Models supporting soft deletes:
- User
- Experience
- Booking (implicit through cascade)

**Implementation**:
```typescript
// Soft delete
await prisma.experience.update({
  where: { id },
  data: { deletedAt: new Date() },
})

// Query excluding soft deleted
const active = await prisma.experience.findMany({
  where: { deletedAt: null },
})
```

## Performance Optimizations

### Connection Pooling
Prisma automatically pools connections. Configure in `DATABASE_URL`:
```
postgresql://user:password@localhost:5432/db?connection_limit=10
```

### Select Specific Fields
```typescript
// ❌ Fetches all fields
const users = await prisma.user.findMany()

// ✅ Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
  },
})
```

### Pagination
```typescript
// Offset pagination
const experiences = await prisma.experience.findMany({
  skip: (page - 1) * limit,
  take: limit,
})

// Cursor pagination (better for large datasets)
const experiences = await prisma.experience.findMany({
  take: 10,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
})
```

### Batch Operations
```typescript
// ❌ N+1 queries
for (const booking of bookings) {
  await prisma.payment.create({ data: { bookingId: booking.id, ... } })
}

// ✅ Single batch operation
await prisma.payment.createMany({
  data: bookings.map(b => ({ bookingId: b.id, ... })),
})
```

## Migration Best Practices

### Development
```bash
# Create migration
pnpm prisma migrate dev --name add_user_bio

# Reset database
pnpm prisma migrate reset
```

### Production
```bash
# Apply migrations
pnpm prisma migrate deploy

# Never run reset in production!
```

### Guidelines
1. **Never edit existing migrations** - create new ones
2. **Test on dev data first** before production
3. **Backup before migrations** in production
4. **Use transactions** for multi-step migrations
5. **Create indexes after data** for large tables

## Scheduled Tasks

### 24-Hour Booking Auto-Reject
```typescript
@Cron('*/5 * * * *') // Every 5 minutes
async handleExpiredBookings() {
  const expired = await this.prisma.booking.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: 'Host did not respond within 24 hours',
    },
  })
}
```

## Security Considerations

1. **Password Hashing**: bcrypt with salt rounds (10+)
2. **SQL Injection**: Protected by Prisma's query builder
3. **Data Validation**: class-validator on DTOs
4. **Soft Deletes**: Preserve audit trail
5. **Role-Based Access**: Enforce at application level
6. **Rate Limiting**: Prevent abuse of expensive queries

## Monitoring Queries

### Enable Query Logging
```typescript
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

### Identify Slow Queries
Monitor PostgreSQL's `pg_stat_statements` extension:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Future Enhancements

1. **Full-text Search**: PostgreSQL `ts_vector` for experience search
2. **Notifications**: Table for user notifications
3. **Favorites**: User saved experiences
4. **Categories**: Dedicated category table with hierarchy
5. **Host Verification**: Verification status and documents
6. **Promotions**: Discount codes and special offers
7. **Analytics**: Aggregated tables for reporting
