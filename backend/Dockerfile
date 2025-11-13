FROM node:20-alpine

WORKDIR /app

# Instalar deps do backend
COPY backend/package*.json ./
RUN npm ci

# Copiar código do backend
COPY backend/ ./

# Buildar frontend
WORKDIR /app/../frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Voltar pro backend
WORKDIR /app

EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]
