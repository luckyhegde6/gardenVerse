FROM node:20-alpine AS base

FROM base AS mqtt-bridge
WORKDIR /app
COPY mqtt-bridge/package*.json ./
RUN npm ci --production
COPY mqtt-bridge/ .
CMD ["node", "index.js"]

FROM base AS gateway
WORKDIR /app
COPY gateway/package*.json ./
RUN npm ci --production
COPY gateway/ .
CMD ["node", "index.js"]

FROM base AS simulator
WORKDIR /app
COPY simulator/package*.json ./
RUN npm ci --production
COPY simulator/ .
CMD ["node", "index.js"]
