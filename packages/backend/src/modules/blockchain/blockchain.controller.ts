import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { RecordTransactionDto } from './dto/blockchain.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Blockchain')
@Controller('blockchain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('transactions')
  @ApiOperation({ summary: 'Record a blockchain transaction' })
  async recordTransaction(@CurrentUser('id') userId: string, @Body() dto: RecordTransactionDto) {
    return this.blockchainService.recordTransaction(userId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(@CurrentUser('id') userId: string) {
    return this.blockchainService.getTransactionHistory(userId);
  }

  @Get('transactions/:id/verify')
  @ApiOperation({ summary: 'Verify a transaction' })
  async verifyTransaction(@Param('id') id: string) {
    return this.blockchainService.verifyTransaction(id);
  }
}
