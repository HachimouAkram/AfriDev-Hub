# ==============================================================================
# AfriDev Hub - Frontend Production Container (Systalink)
# Multi-stage lightweight build: Node 20 + Angular dist + server.js reverse proxy
# ==============================================================================

# Stage 1: Build Angular Frontend
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies with clean cache
COPY frontend-angular/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --no-audit

# Copy sources and build
COPY frontend-angular/ ./
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:20-alpine
WORKDIR /app

# Copy built distribution and server.js
COPY --from=build /app/dist ./dist
COPY frontend-angular/server.js ./server.js
COPY frontend-angular/package.json ./package.json

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
# URL of Spring Boot Backend on your VPS (IP 31.207.36.107)
ENV BACKEND_URL=http://31.207.36.107:8081

EXPOSE 8080

CMD ["node", "server.js"]
