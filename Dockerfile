# ==============================================================================
# AfriDev Hub — All-In-One Unified Production Container
# Frontend (Angular 18) + Backend Core (Spring Boot 3 / Java 21) + Analytics (FastAPI Python)
# Reverse-proxied via High-Performance Nginx Gateway
# ==============================================================================

# -------------------------------------------------------------
# Stage 1: Build Angular Frontend SPA
# -------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend-angular/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --no-audit

COPY frontend-angular/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Build Spring Boot Core Backend
# -------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /build

COPY backend-spring/pom.xml ./
RUN mvn dependency:go-offline -B || true

COPY backend-spring/src ./src
RUN mvn clean package -DskipTests -B

# -------------------------------------------------------------
# Stage 3: Final Production Runtime Image
# -------------------------------------------------------------
FROM eclipse-temurin:21-jre-noble

# Install Nginx, Python 3 and system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setup Python FastAPI Microservice
COPY backend-fastapi /app/backend-fastapi
RUN python3 -m venv /app/backend-fastapi/venv && \
    /app/backend-fastapi/venv/bin/pip install --no-cache-dir -r /app/backend-fastapi/requirements.txt

# 2. Setup Spring Boot Executable JAR
COPY --from=backend-builder /build/target/*.jar /app/app.jar

# 3. Setup Angular Static Web Assets
COPY --from=frontend-builder /build/dist/frontend-angular/browser /var/www/frontend

# 4. Setup Nginx Gateway Configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 5. Setup Master Entrypoint
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
