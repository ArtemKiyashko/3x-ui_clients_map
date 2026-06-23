# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Установим dumb-init для правильной обработки сигналов
RUN apk add --no-cache dumb-init

# Копируем зависимости из builder
COPY --from=builder /app/node_modules ./node_modules

# Копируем приложение
COPY server.js .
COPY public ./public

# Создаём non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
