import { Module } from '@nestjs/common';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';
import { AgentModule } from '@/agents/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}
