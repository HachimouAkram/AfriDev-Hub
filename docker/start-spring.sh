#!/bin/sh
set -e

echo "=========================================================="
echo "🌍 Démarrage AfriDev Hub Backend Spring Boot (Java 21)"
echo "PORT configuré: ${PORT:-8080}"
echo "=========================================================="

if [ "$#" -gt 0 ]; then
  echo "Exécution de la commande transmise : $@"
  exec "$@"
fi

exec java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Xss512k \
  -Djava.security.egd=file:/dev/./urandom \
  -Dserver.port=${PORT:-8080} \
  -jar /app/app.jar
