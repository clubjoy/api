import { PrismaClient, Role, ExperienceStatus, BookingStatus, PaymentStatus, PaymentProvider, Language } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data in development
  if (process.env.NODE_ENV !== 'production') {
    await prisma.rescheduleRequest.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.experienceTranslation.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@clubjoys.com',
      passwordHash,
      role: Role.OWNER,
      firstName: 'Admin',
      lastName: 'ClubJoys',
      phone: '+39 123 456 7890',
      locale: 'en',
      bio: 'Platform administrator',
    },
  });

  const host1 = await prisma.user.create({
    data: {
      email: 'marco.rossi@example.com',
      passwordHash,
      role: Role.HOST,
      firstName: 'Marco',
      lastName: 'Rossi',
      phone: '+39 345 678 9012',
      locale: 'it',
      bio: 'Passionate sommelier and wine expert from Tuscany. 15 years of experience in hospitality.',
    },
  });

  const host2 = await prisma.user.create({
    data: {
      email: 'sofia.ferrari@example.com',
      passwordHash,
      role: Role.HOST,
      firstName: 'Sofia',
      lastName: 'Ferrari',
      phone: '+39 320 123 4567',
      locale: 'it',
      bio: 'Professional chef specializing in traditional Italian cuisine. Host cooking classes in Rome.',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'John',
        lastName: 'Doe',
        locale: 'en',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Jane',
        lastName: 'Smith',
        locale: 'en',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.garcia@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Maria',
        lastName: 'Garcia',
        locale: 'es',
      },
    }),
    prisma.user.create({
      data: {
        email: 'hans.mueller@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Hans',
        lastName: 'Mueller',
        locale: 'de',
      },
    }),
    prisma.user.create({
      data: {
        email: 'luca.bianchi@example.com',
        passwordHash,
        role: Role.USER,
        firstName: 'Luca',
        lastName: 'Bianchi',
        locale: 'it',
      },
    }),
  ]);

  console.log(`Created ${users.length + 3} users`);

  // Create experiences with translations
  const experiences = [];

  // Experience 1: Wine Tasting
  const exp1 = await prisma.experience.create({
    data: {
      title: 'Wine Tasting in Tuscany',
      slug: 'wine-tasting-tuscany',
      description: 'Enjoy a beautiful wine tasting experience in the heart of Tuscany. Visit our family-owned vineyard and taste premium Chianti wines.',
      price: 89.99,
      currency: 'EUR',
      duration: 180,
      maxGuests: 8,
      minGuests: 2,
      location: 'Greve in Chianti, Tuscany',
      latitude: 43.5852,
      longitude: 11.3133,
      address: 'Via del Vino 15',
      city: 'Greve in Chianti',
      country: 'Italy',
      status: ExperienceStatus.PUBLISHED,
      hostId: host1.id,
      images: [
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb',
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
      ],
      coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb',
      category: 'Food & Drink',
      tags: ['wine', 'tuscany', 'italian', 'tasting', 'vineyard'],
      approvedAt: new Date(),
      approvedBy: owner.id,
      translations: {
        create: [
          {
            language: Language.en,
            title: 'Wine Tasting in Tuscany',
            description: 'Enjoy a beautiful wine tasting experience in the heart of Tuscany. Visit our family-owned vineyard and taste premium Chianti wines.',
          },
          {
            language: Language.it,
            title: 'Degustazione di Vini in Toscana',
            description: 'Goditi una bellissima esperienza di degustazione vini nel cuore della Toscana. Visita il nostro vigneto di famiglia e assaggia i migliori vini Chianti.',
          },
          {
            language: Language.es,
            title: 'Cata de Vinos en la Toscana',
            description: 'Disfruta de una hermosa experiencia de cata de vinos en el corazón de la Toscana. Visita nuestro viñedo familiar y prueba los mejores vinos Chianti.',
          },
          {
            language: Language.de,
            title: 'Weinprobe in der Toskana',
            description: 'Genießen Sie eine wunderbare Weinprobe im Herzen der Toskana. Besuchen Sie unser Familienweingut und probieren Sie erstklassige Chianti-Weine.',
          },
        ],
      },
    },
  });
  experiences.push(exp1);

  // Experience 2: Cooking Class
  const exp2 = await prisma.experience.create({
    data: {
      title: 'Roman Pasta Making Class',
      slug: 'roman-pasta-making-class',
      description: 'Learn to make authentic Roman pasta from scratch. We\'ll prepare carbonara, cacio e pepe, and amatriciana together.',
      price: 75.00,
      currency: 'EUR',
      duration: 150,
      maxGuests: 6,
      minGuests: 1,
      location: 'Trastevere, Rome',
      latitude: 41.8891,
      longitude: 12.4708,
      address: 'Via della Scala 23',
      city: 'Rome',
      country: 'Italy',
      status: ExperienceStatus.PUBLISHED,
      hostId: host2.id,
      images: [
        'https://images.unsplash.com/photo-1556910110-a5a63dfd393c',
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
      ],
      coverImage: 'https://images.unsplash.com/photo-1556910110-a5a63dfd393c',
      category: 'Food & Drink',
      tags: ['cooking', 'pasta', 'rome', 'italian', 'culinary'],
      approvedAt: new Date(),
      approvedBy: owner.id,
      translations: {
        create: [
          {
            language: Language.en,
            title: 'Roman Pasta Making Class',
            description: 'Learn to make authentic Roman pasta from scratch. We\'ll prepare carbonara, cacio e pepe, and amatriciana together.',
          },
          {
            language: Language.it,
            title: 'Corso di Pasta Romana',
            description: 'Impara a fare la pasta romana autentica da zero. Prepareremo insieme carbonara, cacio e pepe e amatriciana.',
          },
          {
            language: Language.es,
            title: 'Clase de Pasta Romana',
            description: 'Aprende a hacer pasta romana auténtica desde cero. Prepararemos juntos carbonara, cacio e pepe y amatriciana.',
          },
          {
            language: Language.de,
            title: 'Römischer Pasta-Kochkurs',
            description: 'Lernen Sie, authentische römische Pasta von Grund auf zu machen. Wir bereiten zusammen Carbonara, Cacio e Pepe und Amatriciana zu.',
          },
        ],
      },
    },
  });
  experiences.push(exp2);

  // Experience 3: Gondola Tour
  const exp3 = await prisma.experience.create({
    data: {
      title: 'Sunset Gondola Ride in Venice',
      slug: 'sunset-gondola-venice',
      description: 'Experience the magic of Venice at sunset aboard a traditional gondola. Glide through historic canals with a skilled gondolier.',
      price: 120.00,
      currency: 'EUR',
      duration: 60,
      maxGuests: 4,
      minGuests: 2,
      location: 'San Marco, Venice',
      latitude: 45.4345,
      longitude: 12.3387,
      address: 'Piazza San Marco',
      city: 'Venice',
      country: 'Italy',
      status: ExperienceStatus.PUBLISHED,
      hostId: host1.id,
      images: [
        'https://images.unsplash.com/photo-1514890547357-a9ee288728e0',
      ],
      coverImage: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0',
      category: 'Adventure',
      tags: ['gondola', 'venice', 'sunset', 'romantic', 'canal'],
      approvedAt: new Date(),
      approvedBy: owner.id,
      translations: {
        create: [
          {
            language: Language.en,
            title: 'Sunset Gondola Ride in Venice',
            description: 'Experience the magic of Venice at sunset aboard a traditional gondola. Glide through historic canals with a skilled gondolier.',
          },
          {
            language: Language.it,
            title: 'Giro in Gondola al Tramonto a Venezia',
            description: 'Vivi la magia di Venezia al tramonto a bordo di una gondola tradizionale. Scivola attraverso i canali storici con un gondoliere esperto.',
          },
          {
            language: Language.es,
            title: 'Paseo en Góndola al Atardecer en Venecia',
            description: 'Experimenta la magia de Venecia al atardecer a bordo de una góndola tradicional. Deslízate por los canales históricos con un gondolero experto.',
          },
          {
            language: Language.de,
            title: 'Sonnenuntergangs-Gondelfahrt in Venedig',
            description: 'Erleben Sie die Magie Venedigs bei Sonnenuntergang an Bord einer traditionellen Gondel. Gleiten Sie mit einem erfahrenen Gondoliere durch historische Kanäle.',
          },
        ],
      },
    },
  });
  experiences.push(exp3);

  // Experience 4: Truffle Hunting
  const exp4 = await prisma.experience.create({
    data: {
      title: 'Truffle Hunting in Piedmont',
      slug: 'truffle-hunting-piedmont',
      description: 'Join us for an authentic truffle hunting experience in the forests of Piedmont with trained dogs. Includes truffle-based lunch.',
      price: 150.00,
      currency: 'EUR',
      duration: 240,
      maxGuests: 6,
      minGuests: 2,
      location: 'Alba, Piedmont',
      latitude: 44.7008,
      longitude: 8.0352,
      address: 'Via delle Langhe 45',
      city: 'Alba',
      country: 'Italy',
      status: ExperienceStatus.PUBLISHED,
      hostId: host2.id,
      images: [
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
      ],
      coverImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
      category: 'Food & Drink',
      tags: ['truffle', 'hunting', 'piedmont', 'nature', 'gourmet'],
      approvedAt: new Date(),
      approvedBy: owner.id,
      translations: {
        create: [
          {
            language: Language.en,
            title: 'Truffle Hunting in Piedmont',
            description: 'Join us for an authentic truffle hunting experience in the forests of Piedmont with trained dogs. Includes truffle-based lunch.',
          },
          {
            language: Language.it,
            title: 'Caccia al Tartufo in Piemonte',
            description: 'Unisciti a noi per un\'autentica esperienza di caccia al tartufo nei boschi del Piemonte con cani addestrati. Include pranzo a base di tartufo.',
          },
          {
            language: Language.es,
            title: 'Caza de Trufas en Piamonte',
            description: 'Únete a nosotros para una auténtica experiencia de caza de trufas en los bosques de Piamonte con perros entrenados. Incluye almuerzo a base de trufa.',
          },
          {
            language: Language.de,
            title: 'Trüffelsuche im Piemont',
            description: 'Begleiten Sie uns zu einem authentischen Trüffeljagd-Erlebnis in den Wäldern des Piemonts mit ausgebildeten Hunden. Inklusive Trüffel-Mittagessen.',
          },
        ],
      },
    },
  });
  experiences.push(exp4);

  // Experience 5: Vespa Tour
  const exp5 = await prisma.experience.create({
    data: {
      title: 'Vintage Vespa Tour of Florence',
      slug: 'vintage-vespa-florence',
      description: 'Explore Florence on a vintage Vespa! Visit hidden gems, panoramic viewpoints, and enjoy authentic gelato stops.',
      price: 95.00,
      currency: 'EUR',
      duration: 120,
      maxGuests: 4,
      minGuests: 1,
      location: 'Florence',
      latitude: 43.7696,
      longitude: 11.2558,
      address: 'Piazzale Michelangelo',
      city: 'Florence',
      country: 'Italy',
      status: ExperienceStatus.PUBLISHED,
      hostId: host1.id,
      images: [
        'https://images.unsplash.com/photo-1557456170-0cf4f4d0d362',
      ],
      coverImage: 'https://images.unsplash.com/photo-1557456170-0cf4f4d0d362',
      category: 'Adventure',
      tags: ['vespa', 'florence', 'tour', 'sightseeing', 'vintage'],
      approvedAt: new Date(),
      approvedBy: owner.id,
      translations: {
        create: [
          {
            language: Language.en,
            title: 'Vintage Vespa Tour of Florence',
            description: 'Explore Florence on a vintage Vespa! Visit hidden gems, panoramic viewpoints, and enjoy authentic gelato stops.',
          },
          {
            language: Language.it,
            title: 'Tour di Firenze in Vespa d\'Epoca',
            description: 'Esplora Firenze su una Vespa d\'epoca! Visita gemme nascoste, punti panoramici e goditi soste per gelato autentico.',
          },
          {
            language: Language.es,
            title: 'Tour en Vespa Vintage por Florencia',
            description: 'Explora Florencia en una Vespa vintage! Visita joyas ocultas, miradores panorámicos y disfruta de paradas de helado auténtico.',
          },
          {
            language: Language.de,
            title: 'Vintage Vespa Tour durch Florenz',
            description: 'Erkunden Sie Florenz auf einer Vintage-Vespa! Besuchen Sie versteckte Schätze, Aussichtspunkte und genießen Sie authentische Gelato-Stopps.',
          },
        ],
      },
    },
  });
  experiences.push(exp5);

  // Experience 6-10: Additional experiences
  const additionalExperiences = await Promise.all([
    prisma.experience.create({
      data: {
        title: 'Amalfi Coast Sailing Experience',
        slug: 'amalfi-coast-sailing',
        description: 'Sail along the stunning Amalfi Coast, swim in crystal-clear waters, and enjoy a seafood lunch onboard.',
        price: 180.00,
        currency: 'EUR',
        duration: 300,
        maxGuests: 8,
        location: 'Positano, Amalfi Coast',
        latitude: 40.6280,
        longitude: 14.4850,
        city: 'Positano',
        country: 'Italy',
        status: ExperienceStatus.PUBLISHED,
        hostId: host2.id,
        category: 'Adventure',
        tags: ['sailing', 'amalfi', 'coast', 'sea', 'boat'],
        approvedAt: new Date(),
        approvedBy: owner.id,
      },
    }),
    prisma.experience.create({
      data: {
        title: 'Sicilian Street Food Tour',
        slug: 'sicilian-street-food-tour',
        description: 'Discover the authentic flavors of Sicily through its vibrant street food scene in Palermo.',
        price: 60.00,
        currency: 'EUR',
        duration: 180,
        maxGuests: 10,
        location: 'Palermo, Sicily',
        latitude: 38.1157,
        longitude: 13.3615,
        city: 'Palermo',
        country: 'Italy',
        status: ExperienceStatus.PUBLISHED,
        hostId: host1.id,
        category: 'Food & Drink',
        tags: ['street food', 'sicily', 'palermo', 'food tour'],
        approvedAt: new Date(),
        approvedBy: owner.id,
      },
    }),
    prisma.experience.create({
      data: {
        title: 'Cinque Terre Hiking Adventure',
        slug: 'cinque-terre-hiking',
        description: 'Hike the scenic trails connecting the five villages of Cinque Terre with a local guide.',
        price: 85.00,
        currency: 'EUR',
        duration: 240,
        maxGuests: 8,
        location: 'Cinque Terre, Liguria',
        latitude: 44.1277,
        longitude: 9.7140,
        city: 'Monterosso',
        country: 'Italy',
        status: ExperienceStatus.PUBLISHED,
        hostId: host2.id,
        category: 'Adventure',
        tags: ['hiking', 'cinque terre', 'nature', 'trails'],
        approvedAt: new Date(),
        approvedBy: owner.id,
      },
    }),
    prisma.experience.create({
      data: {
        title: 'Murano Glass Blowing Workshop',
        slug: 'murano-glass-blowing',
        description: 'Learn the ancient art of Murano glass blowing and create your own glass masterpiece.',
        price: 110.00,
        currency: 'EUR',
        duration: 120,
        maxGuests: 6,
        location: 'Murano, Venice',
        latitude: 45.4559,
        longitude: 12.3553,
        city: 'Venice',
        country: 'Italy',
        status: ExperienceStatus.PUBLISHED,
        hostId: host1.id,
        category: 'Culture',
        tags: ['glass', 'murano', 'art', 'workshop', 'craft'],
        approvedAt: new Date(),
        approvedBy: owner.id,
      },
    }),
    prisma.experience.create({
      data: {
        title: 'Dolomites Sunrise Photography Tour',
        slug: 'dolomites-sunrise-photography',
        description: 'Capture the breathtaking sunrise over the Dolomites with a professional photographer guide.',
        price: 130.00,
        currency: 'EUR',
        duration: 180,
        maxGuests: 5,
        location: 'Tre Cime, Dolomites',
        latitude: 46.6187,
        longitude: 12.3022,
        city: 'Cortina d\'Ampezzo',
        country: 'Italy',
        status: ExperienceStatus.PUBLISHED,
        hostId: host2.id,
        category: 'Culture',
        tags: ['photography', 'dolomites', 'sunrise', 'mountains', 'nature'],
        approvedAt: new Date(),
        approvedBy: owner.id,
      },
    }),
  ]);

  console.log(`Created ${experiences.length + additionalExperiences.length} experiences`);

  // Create availability for experiences
  const today = new Date();
  for (const exp of [...experiences, ...additionalExperiences]) {
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      await prisma.availability.create({
        data: {
          experienceId: exp.id,
          date,
          startTime: '10:00', // Default time slot
          slots: Math.floor(Math.random() * 3) + 2, // 2-4 slots
        },
      });
    }
  }

  console.log('Created availability slots');

  // Create bookings
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);

  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'CJ-2026-000001',
      userId: users[0].id,
      experienceId: exp1.id,
      status: BookingStatus.CONFIRMED,
      startDate: futureDate,
      endDate: new Date(futureDate.getTime() + 3 * 60 * 60 * 1000),
      guests: 2,
      totalPrice: 179.98,
      currency: 'EUR',
      acceptedAt: new Date(),
      confirmedAt: new Date(),
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      bookingNumber: 'CJ-2026-000002',
      userId: users[1].id,
      experienceId: exp2.id,
      status: BookingStatus.PENDING,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
      guests: 1,
      totalPrice: 75.00,
      currency: 'EUR',
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      bookingNumber: 'CJ-2026-000003',
      userId: users[2].id,
      experienceId: exp3.id,
      status: BookingStatus.COMPLETED,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      guests: 2,
      totalPrice: 120.00,
      currency: 'EUR',
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      bookingNumber: 'CJ-2026-000004',
      userId: users[3].id,
      experienceId: exp4.id,
      status: BookingStatus.CANCELLED,
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      guests: 3,
      totalPrice: 450.00,
      currency: 'EUR',
      acceptedAt: new Date(),
      cancelledAt: new Date(),
      cancellationReason: 'Personal reasons - family emergency',
    },
  });

  console.log('Created 4 bookings');

  // Create payments
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      provider: PaymentProvider.STRIPE,
      amount: 179.98,
      currency: 'EUR',
      status: PaymentStatus.COMPLETED,
      transactionId: 'pi_mock_stripe_123456',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      provider: PaymentProvider.PAYPAL,
      amount: 120.00,
      currency: 'EUR',
      status: PaymentStatus.COMPLETED,
      transactionId: 'PAY-mock-paypal-789',
    },
  });

  console.log('Created 2 payments');

  // Create messages
  await Promise.all([
    prisma.message.create({
      data: {
        senderId: users[0].id,
        bookingId: booking1.id,
        content: 'Hi! I\'m really excited about the wine tasting experience. Are there any dietary restrictions I should be aware of?',
      },
    }),
    prisma.message.create({
      data: {
        senderId: host1.id,
        bookingId: booking1.id,
        content: 'Hello! We\'re excited to host you. We can accommodate most dietary restrictions. Please let us know if you have any specific needs.',
        read: true,
        readAt: new Date(),
      },
    }),
    prisma.message.create({
      data: {
        senderId: users[1].id,
        bookingId: booking2.id,
        content: 'Is there parking available near the cooking class location?',
      },
    }),
  ]);

  console.log('Created 3 messages');

  // Create reviews
  await Promise.all([
    prisma.review.create({
      data: {
        userId: users[2].id,
        experienceId: exp3.id,
        bookingId: booking3.id,
        rating: 5,
        comment: 'Absolutely magical experience! The gondola ride at sunset was unforgettable. Our gondolier was very skilled and shared interesting stories about Venice. Highly recommend!',
        hostResponse: 'Thank you so much for your wonderful review! We\'re delighted you enjoyed the experience.',
        respondedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[0].id,
        experienceId: exp1.id,
        bookingId: booking1.id,
        rating: 5,
        comment: 'Outstanding wine tasting! Marco was incredibly knowledgeable and the wines were exceptional. The vineyard setting was beautiful.',
      },
    }),
  ]);

  console.log('Created 2 reviews');

  // Create reschedule request
  await prisma.rescheduleRequest.create({
    data: {
      bookingId: booking2.id,
      oldDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      newDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      requestedBy: 'USER',
      reason: 'Flight delayed - would prefer to reschedule to 3 days later',
      status: 'PENDING',
    },
  });

  console.log('Created 1 reschedule request');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
