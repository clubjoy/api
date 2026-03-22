# ClubJoys API - Quick Setup Guide

Complete setup guide for the ClubJoys API backend.

## Prerequisites

Ensure you have installed:
- **Node.js** 20+ ([download](https://nodejs.org/))
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/))
- **pnpm** (recommended): `npm install -g pnpm`

## Step 1: Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE clubjoys;

# Create user (optional)
CREATE USER clubjoys_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE clubjoys TO clubjoys_user;

# Exit
\q
```

### Alternative: Use Docker

```bash
docker run --name clubjoys-db \
  -e POSTGRES_DB=clubjoys \
  -e POSTGRES_USER=clubjoys_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:14
```

## Step 2: Environment Configuration

```bash
# Navigate to API directory
cd apps/api

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Update DATABASE_URL with your PostgreSQL connection string
```

**Example `.env`:**
```env
DATABASE_URL="postgresql://clubjoys_user:your_password@localhost:5432/clubjoys?schema=public"
JWT_SECRET="your-super-secret-key-change-this"
NODE_ENV="development"
PORT=3000
```

## Step 3: Install Dependencies

```bash
# Install all dependencies
pnpm install

# This will install:
# - NestJS framework
# - Prisma ORM
# - Authentication packages
# - Validation libraries
# - And all other dependencies
```

## Step 4: Database Migration & Seed

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create database tables (run initial migration)
pnpm prisma:migrate

# Seed with sample data
pnpm prisma:seed
```

### What Gets Seeded?

The seed script creates:
- **1 Owner**: `owner@clubjoys.com`
- **2 Hosts**: `marco.rossi@example.com`, `sofia.ferrari@example.com`
- **5 Users**: Various test users
- **10 Experiences**: Across different categories (Food & Drink, Adventure, Culture)
- **Translations**: All experiences in 4 languages (en, it, es, de)
- **4 Bookings**: In different statuses (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- **2 Payments**: Sample Stripe and PayPal transactions
- **3 Messages**: Host-user conversations
- **2 Reviews**: Experience ratings
- **30 days of availability**: For each experience

**Default password for all users**: `password123`

## Step 5: Start the API

```bash
# Development mode (with hot reload)
pnpm start:dev

# The API will start on http://localhost:3000
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 ClubJoys API running on: http://localhost:3000/api/v1
📚 API Documentation: http://localhost:3000/api/v1/docs
```

## Step 6: Verify Installation

### Option 1: Prisma Studio (Database GUI)

```bash
pnpm prisma:studio
```

Opens at `http://localhost:5555` - Browse and edit database records visually.

### Option 2: API Health Check

```bash
curl http://localhost:3000/api/v1
```

### Option 3: Swagger Docs

Open browser to: `http://localhost:3000/api/v1/docs`

## Common Commands

### Database Management

```bash
# Open Prisma Studio (visual database browser)
pnpm prisma:studio

# Create new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
pnpm prisma:reset

# Generate Prisma Client after schema changes
pnpm prisma:generate

# Re-seed database
pnpm prisma:seed
```

### Development

```bash
# Start in development mode
pnpm start:dev

# Start in debug mode
pnpm start:debug

# Build for production
pnpm build

# Start production build
pnpm start:prod
```

### Code Quality

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e
```

## Troubleshooting

### Database Connection Errors

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`
4. Check user permissions

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
1. Change PORT in `.env` to `3001` or another port
2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Prisma Generate Errors

**Error**: `Prisma schema not found`

**Solution**:
```bash
# Ensure you're in the API directory
cd apps/api

# Regenerate Prisma Client
pnpm prisma:generate
```

### Migration Errors

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset and re-run migrations (dev only!)
pnpm prisma migrate reset

# Or resolve conflicts manually
pnpm prisma migrate resolve --applied <migration_name>
```

## Next Steps

1. **Implement Authentication Module** (`src/auth/`)
   - JWT token generation
   - Login/register endpoints
   - Password reset flow

2. **Build Feature Modules**:
   - Users (`src/users/`)
   - Experiences (`src/experiences/`)
   - Bookings (`src/bookings/`)
   - Payments (`src/payments/`)
   - Reviews (`src/reviews/`)
   - Messages (`src/messages/`)

3. **Add Scheduled Tasks**:
   - 24-hour booking auto-rejection
   - Daily analytics aggregation
   - Email notifications

4. **Integrate Payment Providers**:
   - Stripe webhook handlers
   - PayPal integration
   - Satispay setup

5. **Add Testing**:
   - Unit tests for services
   - E2E tests for API endpoints
   - Integration tests for database

## Project Structure

```
apps/api/
├── prisma/
│   ├── migrations/          # Database migration files
│   ├── schema.prisma        # Database schema definition
│   └── seed.ts             # Seed script with sample data
├── src/
│   ├── auth/               # Authentication module (TODO)
│   ├── users/              # Users module (TODO)
│   ├── experiences/        # Experiences module (TODO)
│   ├── bookings/           # Bookings module (TODO)
│   ├── payments/           # Payments module (TODO)
│   ├── reviews/            # Reviews module (TODO)
│   ├── messages/           # Messages module (TODO)
│   ├── common/             # Shared utilities (TODO)
│   ├── config/             # Configuration (TODO)
│   ├── prisma/             # Prisma service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts       # Root application module
│   └── main.ts             # Application entry point
├── test/                   # E2E tests (TODO)
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── DATABASE.md             # Database architecture docs
├── README.md               # Project overview
├── SETUP.md                # This file
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **ClubJoys Database Docs**: See `DATABASE.md`

## Getting Help

- Check `README.md` for API documentation
- Check `DATABASE.md` for database schema details
- Review Prisma schema at `prisma/schema.prisma`
- Browse seed data in `prisma/seed.ts`

---

**Ready to build!** Start by implementing the authentication module or exploring the seeded data in Prisma Studio.
