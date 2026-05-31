import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, RolesGuard],
  exports: [BlockchainService],
})
export class BlockchainModule {}
