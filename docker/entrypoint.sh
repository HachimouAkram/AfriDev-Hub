#!/bin/sh
set -e

echo "=========================================================="
echo "🌍 Starting AfriDev Hub Full-Stack All-In-One Container"
echo "=========================================================="

# 1. Start Python FastAPI Microservice (Port 8000)
echo "[1/3] Starting Python FastAPI Microservice on 127.0.0.1:8000..."
cd /app/backend-fastapi
/app/backend-fastapi/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
FASTAPI_PID=$!

# 2. Start Spring Boot Core API (Port 8081)
echo "[2/3] Starting Spring Boot 3 Core Backend on 127.0.0.1:8081..."
cd /app
java -Dserver.port=8081 -Dfile.encoding=UTF-8 -XX:+UseContainerSupport -XX:MaxRAMPercentage=65.0 -jar /app/app.jar &
SPRING_PID=$!

# 3. Start Nginx Gateway (Port 8080)
echo "[3/3] Starting Nginx Gateway on port 8080..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "✅ All AfriDev Hub services initialized."

# Handle graceful shutdown
trap "kill -TERM $FASTAPI_PID $SPRING_PID $NGINX_PID" SIGINT SIGTERM

wait $NGINX_PID
