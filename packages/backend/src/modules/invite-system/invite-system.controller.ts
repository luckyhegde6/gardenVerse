import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InviteSystemService } from './invite-system.service';
import { CreateInviteDto, RedeemInviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Invite System')
@Controller('invites')
export class InviteSystemController {
  constructor(private readonly inviteSystemService: InviteSystemService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invite' })
  async createInvite(@CurrentUser('id') userId: string, @Body() dto: CreateInviteDto) {
    return this.inviteSystemService.createInvite(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem an invite' })
  async redeemInvite(@CurrentUser('id') userId: string, @Body() dto: RedeemInviteDto) {
    return this.inviteSystemService.redeemInvite(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my invites' })
  async getMyInvites(@CurrentUser('id') userId: string) {
    return this.inviteSystemService.getMyInvites(userId);
  }

  @Public()
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate invite code' })
  async validateCode(@Param('code') code: string) {
    return this.inviteSystemService.validateCode(code);
  }
}
