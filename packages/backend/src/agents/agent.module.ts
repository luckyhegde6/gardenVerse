import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@/prisma/prisma.module';
import { GamificationModule } from '@/modules/gamification/gamification.module';
import { AgentOrchestrator } from './agent-orchestrator.service';
import { GameplayAgent } from './gameplay/gameplay-agent.service';
import { WeatherAgent } from './weather/weather-agent.service';
import { IotAgent } from './iot/iot-agent.service';
import { VisionAgent } from './vision/vision-agent.service';
import { MarketplaceAgent } from './marketplace/marketplace-agent.service';
import { SafetyAgent } from './safety/safety-agent.service';
import { RecommendationAgent } from './recommendation/recommendation-agent.service';

@Module({
  imports: [PrismaModule, HttpModule, GamificationModule],
  providers: [
    AgentOrchestrator,
    GameplayAgent,
    WeatherAgent,
    IotAgent,
    VisionAgent,
    MarketplaceAgent,
    SafetyAgent,
    RecommendationAgent,
  ],
  exports: [AgentOrchestrator, IotAgent, VisionAgent, MarketplaceAgent, SafetyAgent, RecommendationAgent],
})
export class AgentModule {}
