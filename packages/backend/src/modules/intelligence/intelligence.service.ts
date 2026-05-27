import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AdvisoryQueryDto, IngestAdvisoryDto } from './dto/intelligence.dto';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(private prisma: PrismaService) {}

  async getAdvisories(query: AdvisoryQueryDto) {
    const { region, type, search, limit = 20, offset = 0 } = query;

    const where: any = {};

    if (region) where.region = { contains: region, mode: 'insensitive' };
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [advisories, total] = await Promise.all([
      this.prisma.governmentAdvisory.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.governmentAdvisory.count({ where }),
    ]);

    return { advisories, total, limit, offset };
  }

  async getGovernmentSchemes(query: AdvisoryQueryDto) {
    return this.getAdvisories({ ...query, type: 'SCHEME' });
  }

  async ingestAdvisory(dto: IngestAdvisoryDto) {
    const exists = await this.prisma.governmentAdvisory.findFirst({
      where: { title: dto.title, source: dto.source },
    });

    if (exists) {
      return this.prisma.governmentAdvisory.update({
        where: { id: exists.id },
        data: { ...dto, publishedAt: new Date() },
      });
    }

    return this.prisma.governmentAdvisory.create({
      data: { ...dto, publishedAt: new Date() },
    });
  }

  async searchAdvisories(query: string) {
    return this.getAdvisories({ search: query });
  }

  async getRegionalAgricultureNews(region: string) {
    return this.prisma.governmentAdvisory.findMany({
      where: {
        region: { contains: region, mode: 'insensitive' },
        type: 'NEWS',
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }
}
