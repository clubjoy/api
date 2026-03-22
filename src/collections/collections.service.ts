import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Language } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get all published collections (public)
   */
  async findAllPublished(locale?: Language) {
    const collections = await this.prisma.collection.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: locale
          ? { where: { language: locale } }
          : true,
        collectionExperiences: {
          include: {
            experience: {
              select: {
                id: true,
                slug: true,
                title: true,
                coverImage: true,
                price: true,
                currency: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Apply translations if locale provided
    return collections.map((collection) => {
      const translation = collection.translations.find(
        (t) => t.language === locale,
      );
      if (translation) {
        collection.title = translation.title;
        collection.description = translation.description;
      }
      return collection;
    });
  }

  /**
   * Get all collections (Admin)
   */
  async findAll() {
    return this.prisma.collection.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: true,
        collectionExperiences: {
          include: {
            experience: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            collectionExperiences: true,
          },
        },
      },
    });
  }

  /**
   * Get collection by slug
   */
  async findBySlug(slug: string, locale?: Language) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      include: {
        translations: locale
          ? { where: { language: locale } }
          : true,
        collectionExperiences: {
          orderBy: { sortOrder: 'asc' },
          include: {
            experience: {
              include: {
                host: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!collection || collection.deletedAt) {
      throw new NotFoundException('Collection not found');
    }

    // Apply translation if locale provided
    if (locale) {
      const translation = collection.translations.find(
        (t) => t.language === locale,
      );
      if (translation) {
        collection.title = translation.title;
        collection.description = translation.description;
      }
    }

    return collection;
  }

  /**
   * Create collection
   */
  async create(dto: {
    title: string;
    description: string;
    coverImage?: string;
    isPublished?: boolean;
    translations?: Array<{
      language: Language;
      title: string;
      description: string;
    }>;
  }) {
    // Generate slug
    const slug = this.generateSlug(dto.title);

    // Check slug uniqueness
    const existing = await this.prisma.collection.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Collection with this title already exists');
    }

    // Get max sortOrder
    const maxSort = await this.prisma.collection.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    // Create collection
    const collection = await this.prisma.collection.create({
      data: {
        slug,
        title: dto.title,
        description: dto.description,
        coverImage: dto.coverImage,
        isPublished: dto.isPublished || false,
        sortOrder,
      },
      include: {
        translations: true,
        collectionExperiences: true,
      },
    });

    // Add translations if provided
    if (dto.translations && dto.translations.length > 0) {
      await Promise.all(
        dto.translations.map((translation) =>
          this.prisma.collectionTranslation.create({
            data: {
              collectionId: collection.id,
              language: translation.language,
              title: translation.title,
              description: translation.description,
            },
          }),
        ),
      );
    }

    console.log('[COLLECTION] Created:', {
      slug: collection.slug,
      title: collection.title,
      isPublished: collection.isPublished,
    });

    return collection;
  }

  /**
   * Update collection
   */
  async update(
    id: string,
    dto: {
      title?: string;
      description?: string;
      coverImage?: string;
      isPublished?: boolean;
    },
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection || collection.deletedAt) {
      throw new NotFoundException('Collection not found');
    }

    // If title changed, regenerate slug
    let slug = collection.slug;
    if (dto.title && dto.title !== collection.title) {
      slug = this.generateSlug(dto.title);

      // Check new slug uniqueness
      const existing = await this.prisma.collection.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Collection with this title already exists');
      }
    }

    const updated = await this.prisma.collection.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
      include: {
        translations: true,
        collectionExperiences: true,
      },
    });

    console.log('[COLLECTION] Updated:', {
      id: updated.id,
      slug: updated.slug,
    });

    return updated;
  }

  /**
   * Delete collection (soft delete)
   */
  async remove(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection || collection.deletedAt) {
      throw new NotFoundException('Collection not found');
    }

    await this.prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    console.log('[COLLECTION] Deleted:', { id, slug: collection.slug });

    return { message: 'Collection deleted successfully' };
  }

  /**
   * Add experience to collection
   */
  async addExperience(collectionId: string, experienceId: string) {
    // Check collection exists
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.deletedAt) {
      throw new NotFoundException('Collection not found');
    }

    // Check experience exists
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    // Check if already added
    const existing = await this.prisma.collectionExperience.findUnique({
      where: {
        collectionId_experienceId: {
          collectionId,
          experienceId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Experience already in collection');
    }

    // Get max sortOrder in collection
    const maxSort = await this.prisma.collectionExperience.findFirst({
      where: { collectionId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = (maxSort?.sortOrder || 0) + 1;

    // Add experience
    const collectionExperience =
      await this.prisma.collectionExperience.create({
        data: {
          collectionId,
          experienceId,
          sortOrder,
        },
        include: {
          experience: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
        },
      });

    console.log('[COLLECTION] Added experience:', {
      collectionId,
      experienceId,
      sortOrder,
    });

    return collectionExperience;
  }

  /**
   * Remove experience from collection
   */
  async removeExperience(collectionId: string, experienceId: string) {
    const collectionExperience =
      await this.prisma.collectionExperience.findUnique({
        where: {
          collectionId_experienceId: {
            collectionId,
            experienceId,
          },
        },
      });

    if (!collectionExperience) {
      throw new NotFoundException('Experience not in collection');
    }

    await this.prisma.collectionExperience.delete({
      where: { id: collectionExperience.id },
    });

    console.log('[COLLECTION] Removed experience:', {
      collectionId,
      experienceId,
    });

    return { message: 'Experience removed from collection' };
  }

  /**
   * Reorder experiences in collection
   */
  async reorderExperiences(
    collectionId: string,
    experienceIds: string[],
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.deletedAt) {
      throw new NotFoundException('Collection not found');
    }

    // Update sortOrder for each experience
    await Promise.all(
      experienceIds.map((experienceId, index) =>
        this.prisma.collectionExperience.updateMany({
          where: {
            collectionId,
            experienceId,
          },
          data: { sortOrder: index },
        }),
      ),
    );

    console.log('[COLLECTION] Reordered experiences:', {
      collectionId,
      count: experienceIds.length,
    });

    return { message: 'Experiences reordered successfully' };
  }

  /**
   * Reorder collections
   */
  async reorderCollections(collectionIds: string[]) {
    await Promise.all(
      collectionIds.map((collectionId, index) =>
        this.prisma.collection.update({
          where: { id: collectionId },
          data: { sortOrder: index },
        }),
      ),
    );

    console.log('[COLLECTION] Reordered collections:', {
      count: collectionIds.length,
    });

    return { message: 'Collections reordered successfully' };
  }
}
