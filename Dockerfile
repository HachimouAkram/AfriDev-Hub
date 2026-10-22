FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY backend-spring/pom.xml .
RUN mvn dependency:go-offline -B || true
COPY backend-spring/src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache bash curl
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar
COPY docker/start-spring.sh /app/entrypoint.sh
COPY docker/start-spring.sh /app/start-spring.sh
RUN chmod +x /app/entrypoint.sh /app/start-spring.sh

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
