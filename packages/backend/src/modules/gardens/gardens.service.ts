import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateGardenDto, UpdateGardenDto } from './dto/garden.dto';

@Injectable()
export class GardensService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGardenDto) {
    const existing = await this.prisma.garden.findUnique({ where: { userId } });
    if (existing) {
      throw new ForbiddenException('User already has a garden');
    }

    return this.prisma.garden.create({
      data: {
        ...dto,
        userId,
      },
      include: { crops: true },
    });
  }

  async findByUserId(userId: string) {
    const garden = await this.prisma.garden.findUnique({
      where: { userId },
      include: { crops: true },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    return garden;
  }

  async findById(id: string) {
    const garden = await this.prisma.garden.findUnique({
      where: { id },
      include: { crops: true },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    return garden;
  }

  async update(userId: string, dto: UpdateGardenDto) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    return this.prisma.garden.update({
      where: { userId },
      data: dto,
      include: { crops: true },
    });
  }

  async delete(userId: string) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    await this.prisma.crop.deleteMany({ where: { gardenId: garden.id } });
    await this.prisma.garden.delete({ where: { id: garden.id } });

    return { message: 'Garden deleted successfully' };
  }

  async getAnalytics(userId: string) {
    const garden = await this.prisma.garden.findUnique({
      where: { userId },
      include: { crops: true },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    const totalCrops = garden.crops.length;
    const healthyCrops = garden.crops.filter((c: any) => c.health > 70).length;
    const diseasedCrops = garden.crops.filter((c: any) => c.status === 'DISEASED').length;
    const matureCrops = garden.crops.filter((c: any) => c.status === 'MATURE').length;
    const harvestedCrops = garden.crops.filter((c: any) => c.status === 'HARVESTED').length;

    return {
      totalCrops,
      healthyCrops,
      diseasedCrops,
      matureCrops,
      harvestedCrops,
      healthPercentage: totalCrops > 0 ? Math.round((healthyCrops / totalCrops) * 100) : 0,
      soilQuality: garden.soilQuality,
      irrigationLevel: garden.irrigationLevel,
      sunlightExposure: garden.sunlightExposure,
    };
  }
}
