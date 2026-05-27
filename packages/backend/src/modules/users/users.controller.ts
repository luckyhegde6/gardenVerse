import { Controller, Get, Put, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateAvatarDto, LeaderboardQueryDto, UserSearchDto } from './dto/user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update avatar' })
  async updateAvatar(@CurrentUser('id') userId: string, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user stats' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.usersService.getStats(userId);
  }

  @Public()
  @Get('profile/:username')
  @ApiOperation({ summary: 'Get user profile by username' })
  async getProfileByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.usersService.getLeaderboard(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query() query: UserSearchDto) {
    return this.usersService.searchUsers(query);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.usersService.deleteAccount(userId);
  }
}
