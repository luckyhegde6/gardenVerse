import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QrSignatureUtil, QrPayload } from '@/common/utils/qr-signature.util';
import { GenerateQrDto, UseQrDto } from './dto/qr.dto';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly replayCache = new Set<string>();

  constructor(private prisma: PrismaService) {}

  async generateSession(userId: string, dto: GenerateQrDto) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (dto.expiresInSeconds || 300));

    const payload: QrPayload = {
      type: dto.type,
      data: dto.payload,
      nonce: QrSignatureUtil.generateNonce(),
      createdAt: new Date().toISOString(),
    };

    const signedData = QrSignatureUtil.sign(payload);

    const session = await this.prisma.qrSession.create({
      data: {
        type: dto.type,
        payload: dto.payload,
        signature: signedData,
        expiresAt,
        createdById: userId,
      },
    });

    return {
      sessionId: session.id,
      qrData: signedData,
      expiresAt,
    };
  }

  async validateSession(sessionId: string, _signature: string) {
    const session = await this.prisma.qrSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('QR session not found');
    if (session.isUsed) throw new BadRequestException('QR session already used');
    if (session.expiresAt < new Date()) throw new BadRequestException('QR session expired');

    const payload = QrSignatureUtil.verify(session.signature);
    if (!payload) throw new BadRequestException('Invalid QR signature');

    if (QrSignatureUtil.isExpired(payload, 5 * 60 * 1000)) {
      throw new BadRequestException('QR payload expired');
    }

    if (this.replayCache.has(sessionId)) {
      throw new BadRequestException('QR replay detected');
    }

    return { valid: true, type: session.type, payload: session.payload };
  }

  async useSession(sessionId: string, userId: string, _dto: UseQrDto) {
    const session = await this.prisma.qrSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('QR session not found');
    if (session.isUsed) throw new BadRequestException('QR session already used');
    if (session.expiresAt < new Date()) throw new BadRequestException('QR session expired');

    const payload = QrSignatureUtil.verify(session.signature);
    if (!payload) throw new BadRequestException('Invalid QR signature');

    if (this.replayCache.has(sessionId)) {
      throw new BadRequestException('QR replay detected - session already consumed');
    }

    this.replayCache.add(sessionId);

    // Prune old cache entries when exceeding limit
    if (this.replayCache.size > 10000) {
      this.replayCache.clear();
    }

    const updated = await this.prisma.qrSession.update({
      where: { id: sessionId },
      data: {
        isUsed: true,
        usedById: userId,
      },
    });

    return {
      message: 'QR session used successfully',
      type: updated.type,
      payload: updated.payload,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.qrSession.findUnique({
      where: { id: sessionId },
      include: {
        createdBy: { select: { id: true, username: true } },
        usedBy: { select: { id: true, username: true } },
      },
    });

    if (!session) throw new NotFoundException('QR session not found');
    return session;
  }
}
