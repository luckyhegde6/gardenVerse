import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { AgentModule } from '@/agents/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
