# ==============================================================================
# AfriDev Hub - Frontend Production Container (frontend-angular)
# ==============================================================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --no-audit

COPY . ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY package.json ./package.json

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV BACKEND_URL=http://31.207.36.107:8081

EXPOSE 8080

CMD ["node", "server.js"]
