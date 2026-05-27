export enum AgentName {
  GAMEPLAY = 'gameplay',
  WEATHER = 'weather',
  IOT = 'iot',
  VISION = 'vision',
  MARKETPLACE = 'marketplace',
  SAFETY = 'safety',
  RECOMMENDATION = 'recommendation',
}

export enum AgentStatus {
  INITIALIZING = 'initializing',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  IDLE = 'idle',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
}

export interface AgentEvent<T = unknown> {
  id: string;
  source: AgentName;
  type: string;
  version: number;
  timestamp: string;
  payload: T;
  traceId: string;
  correlationId?: string;
}

export interface AgentRegistration {
  name: AgentName;
  version: string;
  status: AgentStatus;
  eventSubscriptions: string[];
  eventEmissions: string[];
  healthCheck(): Promise<AgentHealth>;
  startedAt: string;
}

export interface AgentHealth {
  status: AgentStatus;
  uptime: number;
  eventsProcessed: number;
  errorsLastHour: number;
  queueDepth: number;
  memoryUsage: number;
  lastProcessedTimestamp: string | null;
}

export interface AgentConfig {
  name: AgentName;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelayMs: number;
  queueName: string;
  deadLetterQueue: string;
}

export const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  [AgentName.GAMEPLAY]: {
    name: AgentName.GAMEPLAY,
    maxConcurrency: 10,
    retryAttempts: 3,
    retryDelayMs: 1000,
    queueName: 'agent:gameplay',
    deadLetterQueue: 'agent:gameplay:dead',
  },
  [AgentName.WEATHER]: {
    name: AgentName.WEATHER,
    maxConcurrency: 5,
    retryAttempts: 2,
    retryDelayMs: 2000,
    queueName: 'agent:weather',
    deadLetterQueue: 'agent:weather:dead',
  },
  [AgentName.IOT]: {
    name: AgentName.IOT,
    maxConcurrency: 50,
    retryAttempts: 3,
    retryDelayMs: 500,
    queueName: 'agent:iot',
    deadLetterQueue: 'agent:iot:dead',
  },
  [AgentName.VISION]: {
    name: AgentName.VISION,
    maxConcurrency: 5,
    retryAttempts: 2,
    retryDelayMs: 3000,
    queueName: 'agent:vision',
    deadLetterQueue: 'agent:vision:dead',
  },
  [AgentName.MARKETPLACE]: {
    name: AgentName.MARKETPLACE,
    maxConcurrency: 10,
    retryAttempts: 3,
    retryDelayMs: 1000,
    queueName: 'agent:marketplace',
    deadLetterQueue: 'agent:marketplace:dead',
  },
  [AgentName.SAFETY]: {
    name: AgentName.SAFETY,
    maxConcurrency: 5,
    retryAttempts: 2,
    retryDelayMs: 2000,
    queueName: 'agent:safety',
    deadLetterQueue: 'agent:safety:dead',
  },
  [AgentName.RECOMMENDATION]: {
    name: AgentName.RECOMMENDATION,
    maxConcurrency: 10,
    retryAttempts: 2,
    retryDelayMs: 1000,
    queueName: 'agent:recommendation',
    deadLetterQueue: 'agent:recommendation:dead',
  },
};

export const EVENT_TYPES = {
  // Gameplay events
  CROP_PLANTED: 'gameplay.crop.planted',
  CROP_WATERED: 'gameplay.crop.watered',
  CROP_FERTILIZED: 'gameplay.crop.fertilized',
  CROP_HARVESTED: 'gameplay.crop.harvested',
  CROP_GROWTH_TICK: 'gameplay.crop.growth.tick',
  CROP_HEALTH_CHANGED: 'gameplay.crop.health.changed',
  XP_AWARDED: 'gameplay.xp.awarded',
  LEVEL_UP: 'gameplay.level.up',
  REWARD_ISSUED: 'gameplay.reward.issued',
  STREAK_UPDATED: 'gameplay.streak.updated',

  // Weather events
  WEATHER_UPDATED: 'weather.data.updated',
  WEATHER_ALERT: 'weather.alert.issued',
  WEATHER_IMPACT_CALCULATED: 'weather.impact.calculated',

  // IoT events
  SENSOR_DATA: 'iot.sensor.data',
  DEVICE_ONLINE: 'iot.device.online',
  DEVICE_OFFLINE: 'iot.device.offline',
  DEVICE_TRUST_UPDATED: 'iot.device.trust.updated',

  // Vision events
  PLANT_IDENTIFIED: 'vision.plant.identified',
  DISEASE_DETECTED: 'vision.disease.detected',
  GROWTH_ANALYZED: 'vision.growth.analyzed',

  // Marketplace events
  LISTING_CREATED: 'marketplace.listing.created',
  TRADE_COMPLETE: 'marketplace.trade.complete',
  DISPUTE_RAISED: 'marketplace.dispute.raised',

  // Safety events
  REPORT_CREATED: 'safety.report.created',
  ACTION_TAKEN: 'safety.action.taken',
  USER_RESTRICTED: 'safety.user.restricted',

  // Recommendation events
  RECOMMENDATION_WATERING: 'recommendation.watering',
  RECOMMENDATION_FERTILIZER: 'recommendation.fertilizer',
  RECOMMENDATION_CROP: 'recommendation.crop',
  RECOMMENDATION_SUSTAINABILITY: 'recommendation.sustainability',
} as const;
