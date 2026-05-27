import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, UserOverrideDto } from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async getAllFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getFlag(name: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new NotFoundException(`Feature flag '${name}' not found`);
    return flag;
  }

  async createFlag(dto: CreateFeatureFlagDto) {
    return this.prisma.featureFlag.create({
      data: {
        name: dto.name,
        enabled: dto.enabled || false,
        description: dto.description,
        rules: dto.rules || undefined,
      },
    });
  }

  async updateFlag(name: string, dto: UpdateFeatureFlagDto) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new NotFoundException(`Feature flag '${name}' not found`);

    return this.prisma.featureFlag.update({
      where: { name },
      data: {
        enabled: dto.enabled,
        description: dto.description,
        rules: dto.rules,
      },
    });
  }

  async deleteFlag(name: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new NotFoundException(`Feature flag '${name}' not found`);

    await this.prisma.featureFlag.delete({ where: { name } });
    return { message: `Flag '${name}' deleted` };
  }

  async checkFlag(name: string, userId?: string): Promise<{ enabled: boolean; overridden: boolean }> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) return { enabled: false, overridden: false };

    let enabled = flag.enabled;

    if (userId) {
      const override = await this.prisma.userFeatureOverride.findUnique({
        where: { userId_featureName: { userId, featureName: name } },
      });

      if (override) {
        return { enabled: override.enabled, overridden: true };
      }
    }

    // Evaluate rollout rules
    if (flag.rules && userId) {
      enabled = this.evaluateRules(flag.rules as any, userId, enabled);
    }

    return { enabled, overridden: false };
  }

  async setUserOverride(userId: string, dto: UserOverrideDto) {
    return this.prisma.userFeatureOverride.upsert({
      where: {
        userId_featureName: { userId, featureName: dto.featureName },
      },
      create: {
        userId,
        featureName: dto.featureName,
        enabled: dto.enabled,
      },
      update: {
        enabled: dto.enabled,
      },
    });
  }

  async removeUserOverride(userId: string, featureName: string) {
    await this.prisma.userFeatureOverride.delete({
      where: { userId_featureName: { userId, featureName } },
    }).catch(() => {});
  }

  private evaluateRules(rules: any, userId: string, currentEnabled: boolean): boolean {
    if (rules?.percentage && typeof rules.percentage === 'number') {
      const hash = this.simpleHash(userId);
      const userPercentile = hash % 100;
      if (userPercentile < rules.percentage) {
        return currentEnabled;
      }
      return false;
    }

    if (rules?.userIds && Array.isArray(rules.userIds)) {
      return rules.userIds.includes(userId) ? currentEnabled : false;
    }

    return currentEnabled;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
