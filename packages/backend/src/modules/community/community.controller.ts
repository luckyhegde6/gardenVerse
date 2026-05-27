import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateGroupDto, GroupQueryDto } from './dto/community.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post('groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a group' })
  async createGroup(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.communityService.createGroup(userId, dto);
  }

  @Public()
  @Get('groups')
  @ApiOperation({ summary: 'Get public groups' })
  async getGroups(@Query() query: GroupQueryDto) {
    return this.communityService.getGroups(query);
  }

  @Public()
  @Get('groups/:id')
  @ApiOperation({ summary: 'Get group by ID' })
  async getGroup(@Param('id') id: string) {
    return this.communityService.getGroupById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('groups/:id/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a group' })
  async joinGroup(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityService.joinGroup(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('groups/:id/leave')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityService.leaveGroup(id, userId);
  }

  @Public()
  @Get('groups/:id/members')
  @ApiOperation({ summary: 'Get group members' })
  async getMembers(@Param('id') id: string) {
    return this.communityService.getGroupMembers(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my groups' })
  async getMyGroups(@CurrentUser('id') userId: string) {
    return this.communityService.getUserGroups(userId);
  }
}
