import { PrismaClient, Role, ExperienceStatus, BookingStatus, PaymentStatus, PaymentProvider, Language } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting simplified seed...');

  // Clear existing data
  await prisma.rescheduleRequest.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.experienceTranslation.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@clubjoys.com',
      passwordHash,
      role: Role.OWNER,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1 555 123 4567',
      locale: 'en',
    },
  });

  // Create Host
  const host = await prisma.user.create({
    data: {
      email: 'host@example.com',
      passwordHash,
      role: Role.HOST,
      firstName: 'Marco',
      lastName: 'Rossi',
      phone: '+39 345 678 9012',
      locale: 'en',
      bio: 'Passionate sommelier and wine expert from Tuscany with 15 years of experience.',
    },
  });

  // Create Regular User
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash,
      role: Role.USER,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 555 987 6543',
      locale: 'en',
    },
  });

  console.log('Created 3 users: owner@clubjoys.com, host@example.com, user@example.com');

  // Create ONE experience - Wine Tasting
  const wineExperience = await prisma.experience.create({
    data: {
      title: 'Wine Tasting in Tuscany',
      slug: 'wine-tasting-tuscany',
      description: 'Embark on an unforgettable journey through the rolling hills of Tuscany, where you\'ll discover the art of Italian winemaking. This intimate experience takes you to a family-owned vineyard that has been producing exceptional wines for generations.\n\nYou\'ll tour the vineyard, learn about the winemaking process, and taste 5 carefully selected wines paired with local cheeses and cured meats. Our expert sommelier will guide you through each tasting, sharing stories about the region\'s rich wine history.',
      price: 89.99,
      currency: 'EUR',
      duration: 180,
      maxGuests: 8,
      minGuests: 2,
      location: 'Tuscany, Italy',
      latitude: 43.7711,
      longitude: 11.2486,
      status: ExperienceStatus.PUBLISHED,
      images: ['/wine-tasting.webp'],
      coverImage: '/wine-tasting.webp',
      category: 'Food & Drink',
      tags: ['wine', 'tuscany', 'italian', 'tasting', 'vineyard'],
      hostId: host.id,
      approvedAt: new Date(),
      approvedBy: owner.id,
    },
  });

  // Add translations for the wine experience
  await prisma.experienceTranslation.createMany({
    data: [
      {
        experienceId: wineExperience.id,
        language: Language.it,
        title: 'Degustazione di Vini in Toscana',
        description: 'Intraprendi un viaggio indimenticabile attraverso le colline della Toscana, dove scoprirai l\'arte della vinificazione italiana.',
      },
      {
        experienceId: wineExperience.id,
        language: Language.es,
        title: 'Cata de Vinos en la Toscana',
        description: 'Embárcate en un viaje inolvidable por las colinas de la Toscana, donde descubrirás el arte de la vinificación italiana.',
      },
      {
        experienceId: wineExperience.id,
        language: Language.de,
        title: 'Weinprobe in der Toskana',
        description: 'Begeben Sie sich auf eine unvergessliche Reise durch die Hügel der Toskana und entdecken Sie die Kunst der italienischen Weinherstellung.',
      },
    ],
  });

  console.log('Created 1 experience: Wine Tasting in Tuscany');

  // Add availability for next 30 days
  const today = new Date();
  const availabilityData = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(14, 0, 0, 0); // 2 PM

    availabilityData.push({
      experienceId: wineExperience.id,
      date,
      slots: 2,
      price: wineExperience.price,
    });
  }

  await prisma.availability.createMany({ data: availabilityData });
  console.log('Created 30 days of availability');

  // Create a sample booking
  const booking = await prisma.booking.create({
    data: {
      bookingNumber: `CJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      userId: user.id,
      experienceId: wineExperience.id,
      status: BookingStatus.PENDING,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      guests: 4,
      totalPrice: 359.96,
      currency: 'EUR',
    },
  });

  console.log('Created 1 sample booking');

  // Create a review
  await prisma.review.create({
    data: {
      userId: user.id,
      experienceId: wineExperience.id,
      bookingId: booking.id,
      rating: 5,
      comment: 'Amazing experience! Marco was incredibly knowledgeable and the wines were exceptional. Highly recommend!',
    },
  });

  console.log('Created 1 review');

  console.log('\n✅ Simplified seed completed!');
  console.log('\n📧 Login credentials:');
  console.log('  Owner: owner@clubjoys.com / password123');
  console.log('  Host:  host@example.com / password123');
  console.log('  User:  user@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
