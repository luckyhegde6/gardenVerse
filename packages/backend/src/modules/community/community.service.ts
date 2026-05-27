import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateGroupDto, GroupQueryDto } from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        region: dto.region,
        isPrivate: dto.isPrivate || false,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
      },
    });

    return group;
  }

  async getGroups(query: GroupQueryDto) {
    const where: any = { isPrivate: false };

    if (query.region) where.region = { contains: query.region, mode: 'insensitive' };
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.group.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  async getGroupById(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, messages: true } },
      },
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing) throw new ConflictException('Already a member');

    return this.prisma.groupMember.create({
      data: { groupId, userId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) throw new NotFoundException('Not a member');
    if (membership.role === 'ADMIN') throw new ForbiddenException('Admin cannot leave group. Transfer ownership first.');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { message: 'Left group successfully' };
  }

  async getGroupMembers(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true } },
      },
    });
  }
}
