# Production Dockerfile for AI Agent Platform Gateway & Cloud Orchestrator
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "apps/api/src/server.js"]
