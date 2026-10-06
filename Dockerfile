FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /app/storage && chown node:node /app/storage
USER node
EXPOSE 3000
# aplica migrations existentes (não destrutivo) e inicia
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
