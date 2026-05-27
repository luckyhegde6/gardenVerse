import { Module } from '@nestjs/common';
import { IotController } from './iot.controller';
import { IotService } from './iot.service';
import { AgentModule } from '@/agents/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [IotController],
  providers: [IotService],
  exports: [IotService],
})
export class IotModule {}
