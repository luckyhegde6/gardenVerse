FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm ci --only=production && cp -R node_modules /prod_node_modules
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=builder /prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
