# ClubJoys API

NestJS-based REST API for the ClubJoys marketplace platform.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (USER, HOST, OWNER)
- **Experience Management**: Full CRUD with approval workflow
- **Booking System**: 24-hour acceptance window with auto-rejection cron job
- **Payment Processing**: Mocked payment providers (Stripe, PayPal, Satispay)
- **Messaging**: Host-user communication per booking
- **Reviews**: Rating system with host responses
- **Notifications**: Console-based email notifications (ready for production integration)

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport JWT
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Scheduling**: @nestjs/schedule (for cron jobs)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### Running the API

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/v1/docs

## API Modules

### 1. Auth Module (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile

### 2. Users Module (`/users`)
- `GET /users` - List all users (OWNER only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (OWNER only)
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user (OWNER only)

### 3. Experiences Module (`/experiences`)
- `GET /experiences` - Search and filter experiences
- `GET /experiences/:id` - Get experience details
- `POST /experiences` - Create experience (HOST only)
- `PATCH /experiences/:id` - Update experience (HOST only)
- `POST /experiences/:id/submit` - Submit for approval (HOST only)
- `POST /experiences/:id/approve` - Approve experience (OWNER only)
- `POST /experiences/:id/reject` - Reject experience (OWNER only)
- `DELETE /experiences/:id` - Delete experience (HOST only)

### 4. Bookings Module (`/bookings`)
- `GET /bookings` - List user's or host's bookings
- `GET /bookings/:id` - Get booking details
- `POST /bookings` - Create booking (USER)
- `POST /bookings/:id/accept` - Accept booking (HOST, within 24h)
- `POST /bookings/:id/reject` - Reject booking (HOST)
- `POST /bookings/:id/cancel` - Cancel booking (USER or HOST)

### 5. Messages Module (`/bookings/:bookingId/messages`)
- `GET /bookings/:bookingId/messages` - Get messages for booking
- `POST /bookings/:bookingId/messages` - Send message
- `PATCH /messages/:id/read` - Mark message as read

### 6. Reviews Module (`/reviews`)
- `POST /bookings/:bookingId/review` - Create review (USER, completed bookings only)
- `GET /experiences/:experienceId/reviews` - Get experience reviews
- `POST /reviews/:id/respond` - Respond to review (HOST)

### 7. Payments Module (`/payments`)
- `POST /payments/process` - Process payment (MOCKED)
- `POST /payments/refund` - Refund payment (MOCKED)
- `GET /payments/:id` - Get payment details

### 8. Health Check (`/health`)
- `GET /health` - API health status

## Business Logic

### Experience Approval Workflow

```
DRAFT → (submit) → PENDING_APPROVAL → (approve) → PUBLISHED
                                     → (reject) → REJECTED
```

Only PUBLISHED experiences are visible to users.

### Booking Lifecycle

```
PENDING → (accept within 24h) → ACCEPTED → (payment) → CONFIRMED → COMPLETED
        → (auto-reject after 24h) → REJECTED
```

**24-Hour Window**: Hosts must accept bookings within 24 hours, or they auto-reject.

**Cron Job**: Runs every hour to auto-reject expired bookings.

### Cancellation Policy

- **>7 days before**: 100% refund
- **3-7 days before**: 50% refund
- **<3 days before**: No refund

## Environment Variables

See `.env.example` for all required variables:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/clubjoys
JWT_SECRET=your-secret-key
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3001
```

## Database

### Migrations

```bash
# Create new migration
npm run prisma:migrate

# Deploy to production
npm run prisma:migrate:prod

# Reset database (DEV ONLY)
npm run prisma:reset
```

### Seed Data

```bash
npm run prisma:seed
```

Creates sample users, experiences, and bookings for testing.

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## Security

- **JWT Authentication**: All protected routes require valid JWT token
- **Role-Based Access Control**: Guards enforce role restrictions (USER, HOST, OWNER)
- **Rate Limiting**: Throttling enabled (configurable via env vars)
- **Input Validation**: All DTOs validated with class-validator
- **SQL Injection Prevention**: Prisma ORM protects against SQL injection
- **Password Hashing**: bcrypt with salt rounds = 10

## Notifications

Currently implemented as console logs with emoji formatting. Ready to integrate with:
- SendGrid
- AWS SES
- Mailgun
- Custom SMTP

All notification methods are in `src/notifications/notifications.service.ts`.

## Mocked Services

### Payment Providers
- Stripe
- PayPal
- Satispay

All payment operations are logged to console. Replace with actual integrations in production.

## License

Private - ClubJoys Team
