# Multi-stage build para StenoPro

FROM node:20-alpine AS base

# ========================================
# STAGE 1: Build completo (backend + frontend)
# ========================================
FROM base AS builder

# Set working directory na raiz
WORKDIR /app

# ========================================
# Build Backend primeiro
# ========================================
# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

# Copy backend source e build
WORKDIR /app
COPY backend/ ./backend/
WORKDIR /app/backend
RUN npm run build

# ========================================
# Build Frontend (com acesso ao backend)
# ========================================
# Install frontend dependencies
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source e build (agora tem acesso a /app/backend)
WORKDIR /app
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm run build

# ========================================
# STAGE 2: Production Backend
# ========================================
FROM base AS backend-production

WORKDIR /app

# Copy backend dependencies and built files
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src ./src

# Copy migrations
COPY backend/migrations ./migrations

# Create storage directories
RUN mkdir -p storage/audio storage/docs

EXPOSE 3001

CMD ["npm", "start"]

# ========================================
# STAGE 3: Production Frontend
# ========================================
FROM base AS frontend-production

WORKDIR /app

# Copy frontend built files
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/dist ./dist
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 4173

CMD ["npm", "run", "preview"]
