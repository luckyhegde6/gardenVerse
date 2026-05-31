import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentName, AgentStatus, AgentEvent, AgentHealth } from './types/agent.types';

@Injectable()
export class AgentOrchestrator extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentOrchestrator.name);
  private readonly agents = new Map<AgentName, AgentRegistration>();
  private readonly eventLog: AgentEvent[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  async onModuleInit() {
    this.logger.log('Agent Orchestrator initializing...');
    this.tickInterval = setInterval(() => this.heartbeat(), 30000);
  }

  async onModuleDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.removeAllListeners();
    this.logger.log('Agent Orchestrator shut down');
  }

  registerAgent(registration: AgentRegistration) {
    this.agents.set(registration.name, registration);
    this.logger.log(`Agent registered: ${registration.name} (v${registration.version})`);
  }

  unregisterAgent(name: AgentName) {
    this.agents.delete(name);
    this.logger.log(`Agent unregistered: ${name}`);
  }

  async emitEvent<T>(source: AgentName, type: string, payload: T): Promise<string> {
    const event: AgentEvent<T> = {
      id: uuidv4(),
      source,
      type,
      version: 1,
      timestamp: new Date().toISOString(),
      payload,
      traceId: uuidv4(),
    };

    this.eventLog.push(event as AgentEvent);
    if (this.eventLog.length > 1000) this.eventLog.shift();

    this.emit(type, event);

    return event.id;
  }

  async getAgentHealth(name: AgentName): Promise<AgentHealth | null> {
    const registration = this.agents.get(name);
    if (!registration) return null;
    return registration.healthCheck();
  }

  getAllRegistrations() {
    return Array.from(this.agents.values());
  }

  async getEventLog(limit = 50): Promise<AgentEvent[]> {
    return this.eventLog.slice(-limit);
  }

  private heartbeat() {
    for (const [name, registration] of this.agents) {
      this.logger.debug(`Agent heartbeat: ${name} — ${registration.status}`);
    }
  }
}

interface AgentRegistration {
  name: AgentName;
  version: string;
  status: AgentStatus;
  eventSubscriptions: string[];
  eventEmissions: string[];
  healthCheck(): Promise<AgentHealth>;
  startedAt: string;
}
