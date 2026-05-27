import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { GenerateQrDto, UseQrDto } from './dto/qr.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '@/common/guards/optional-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate QR session' })
  async generate(@CurrentUser('id') userId: string, @Body() dto: GenerateQrDto) {
    return this.qrService.generateSession(userId, dto);
  }

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate QR session' })
  async validate(@Body() dto: UseQrDto) {
    return this.qrService.validateSession(dto.sessionId, dto.signature);
  }

  @UseGuards(OptionalAuthGuard)
  @Post('use')
  @ApiOperation({ summary: 'Use QR session' })
  async use(@CurrentUser('id') userId: string, @Body() dto: UseQrDto) {
    return this.qrService.useSession(dto.sessionId, userId, dto);
  }

  @Public()
  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get QR session info' })
  async getSession(@Param('id') id: string) {
    return this.qrService.getSession(id);
  }
}
