import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminRegisterDto, AdminLoginDto, AdminUserQueryDto, UpdateUserRoleDto, CreateAdminInviteDto, TokenTransactionQueryDto, AppLogQueryDto } from './dto/admin.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/constants';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register super admin (requires registration code)' })
  async registerSuperAdmin(@Body() dto: AdminRegisterDto) {
    return this.adminService.registerSuperAdmin(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email + password, sets httpOnly cookie' })
  async loginSuperAdmin(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.adminService.loginSuperAdmin(dto);
    res.cookie('access_token', result.accessToken, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth/refresh',
    });
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('performance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get app performance metrics' })
  async getPerformance() {
    return this.adminService.getPerformanceMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users list' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('users/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put('users/:id/role')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('users/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('health')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get token transactions (admin)' })
  async getTokenTransactions(@Query() query: TokenTransactionQueryDto) {
    return this.adminService.getTokenTransactions(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application logs' })
  async getAppLogs(@Query() query: AppLogQueryDto) {
    return this.adminService.getAppLogs(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('invites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invites' })
  async getInvites() {
    return this.adminService.getInvites();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('invites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create invite (code, link, passcode)' })
  async createInvite(@CurrentUser('id') userId: string, @Body() dto: CreateAdminInviteDto) {
    return this.adminService.createInvite(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('invites/:id/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an invite' })
  async revokeInvite(@Param('id') id: string) {
    return this.adminService.revokeInvite(id);
  }
}
