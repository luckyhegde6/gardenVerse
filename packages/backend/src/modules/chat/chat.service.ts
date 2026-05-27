import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EncryptionUtil } from '@/common/utils/encryption.util';
import { SendMessageDto, ConversationQueryDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    if (!dto.receiverId && !dto.groupId) {
      throw new BadRequestException('Either receiverId or groupId is required');
    }

    let content = dto.content;
    let nonce: string | undefined;

    if (dto.isEncrypted !== false) {
      const encrypted = EncryptionUtil.encrypt(dto.content);
      content = encrypted.encrypted;
      nonce = JSON.stringify({ iv: encrypted.iv, tag: encrypted.tag });
    }

    if (dto.groupId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: dto.groupId, userId: senderId } },
      });

      if (!membership) throw new ForbiddenException('Not a member of this group');
    }

    return this.prisma.message.create({
      data: {
        content,
        isEncrypted: dto.isEncrypted !== false,
        nonce,
        senderId,
        receiverId: dto.receiverId || undefined,
        groupId: dto.groupId || undefined,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getConversation(userId: string, query: ConversationQueryDto) {
    const { otherUserId, limit = 50, offset = 0 } = query;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        groupId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return messages.reverse();
  }

  async getGroupMessages(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) throw new ForbiddenException('Not a member of this group');

    const messages = await this.prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return messages.reverse();
  }

  async decryptMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    if (!message || !message.isEncrypted || !message.nonce) {
      throw new BadRequestException('Message not found or not encrypted');
    }

    const { iv, tag } = JSON.parse(message.nonce);
    const decrypted = EncryptionUtil.decrypt(message.content, iv, tag);

    return { id: message.id, content: decrypted };
  }

  async getConversations(userId: string) {
    const sent = await this.prisma.message.findMany({
      where: { senderId: userId, groupId: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['receiverId'],
      include: {
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    const received = await this.prisma.message.findMany({
      where: { receiverId: userId, groupId: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId'],
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    const conversationMap = new Map();

    for (const msg of sent) {
      const key = msg.receiverId;
      if (!conversationMap.has(key) || conversationMap.get(key).createdAt < msg.createdAt) {
        conversationMap.set(key, { user: msg.receiver, lastMessage: msg, unread: 0 });
      }
    }

    for (const msg of received) {
      const key = msg.senderId;
      const existing = conversationMap.get(key);
      if (!existing || existing.lastMessage.createdAt < msg.createdAt) {
        conversationMap.set(key, { user: msg.sender, lastMessage: msg, unread: existing ? existing.unread + 1 : 1 });
      } else if (existing) {
        existing.unread++;
      }
    }

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    );
  }
}
