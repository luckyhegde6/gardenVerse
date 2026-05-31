import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AgentName, AgentStatus, AgentEvent, AgentConfig, AgentHealth } from './types/agent.types';
import { AgentOrchestrator } from './agent-orchestrator.service';

export abstract class BaseAgent implements OnModuleInit, OnModuleDestroy {
  protected abstract readonly agentName: AgentName;
  protected abstract readonly agentVersion: string;
  protected abstract readonly eventSubscriptions: string[];
  protected abstract readonly eventEmissions: string[];

  protected logger!: Logger;
  protected config!: AgentConfig;

  protected status: AgentStatus = AgentStatus.INITIALIZING;
  protected eventsProcessed = 0;
  protected errorsLastHour = 0;
  protected errorResetInterval: ReturnType<typeof setInterval> | null = null;
  protected lastProcessedTimestamp: string | null = null;
  protected startedAt: string;

  constructor(protected readonly orchestrator: AgentOrchestrator) {
    this.startedAt = new Date().toISOString();
  }

  abstract onEvent(event: AgentEvent): Promise<void>;

  async onModuleInit() {
    this.logger.log(`Agent initializing (v${this.agentVersion})...`);

    for (const eventType of this.eventSubscriptions) {
      this.orchestrator.on(eventType, async (event: AgentEvent) => {
        await this.handleEvent(event);
      });
    }

    this.status = AgentStatus.LISTENING;

    this.orchestrator.registerAgent({
      name: this.agentName,
      version: this.agentVersion,
      status: this.status,
      eventSubscriptions: this.eventSubscriptions,
      eventEmissions: this.eventEmissions,
      healthCheck: () => this.getHealth(),
      startedAt: this.startedAt,
    });

    this.errorResetInterval = setInterval(() => {
      this.errorsLastHour = 0;
    }, 3600000);

    this.logger.log(`Agent ready — subscribed to: ${this.eventSubscriptions.join(', ')}`);
  }

  async onModuleDestroy() {
    this.status = AgentStatus.SHUTDOWN;
    this.orchestrator.unregisterAgent(this.agentName);
    if (this.errorResetInterval) clearInterval(this.errorResetInterval);
    this.logger.log('Agent shut down');
  }

  protected async handleEvent(event: AgentEvent): Promise<void> {
    this.status = AgentStatus.PROCESSING;
    this.lastProcessedTimestamp = new Date().toISOString();

    try {
      await this.onEvent(event);
      this.eventsProcessed++;
      this.status = AgentStatus.LISTENING;
    } catch (error) {
      this.errorsLastHour++;
      this.status = AgentStatus.ERROR;
      this.logger.error(`Failed to process event ${event.type}: ${(error as Error).message}`);
    }
  }

  async getHealth(): Promise<AgentHealth> {
    return {
      status: this.status,
      uptime: Date.now() - new Date(this.startedAt).getTime(),
      eventsProcessed: this.eventsProcessed,
      errorsLastHour: this.errorsLastHour,
      queueDepth: 0,
      memoryUsage: process.memoryUsage().heapUsed,
      lastProcessedTimestamp: this.lastProcessedTimestamp,
    };
  }

  protected async emit<T>(type: string, payload: T): Promise<string> {
    return this.orchestrator.emitEvent(this.agentName, type, payload);
  }
}
