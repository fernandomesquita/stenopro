# Multi-stage build para StenoPro

FROM node:20-alpine AS base

# ========================================
# STAGE 1: Build Backend
# ========================================
FROM base AS backend-build

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend (gera tipos TypeScript)
RUN npm run build

# ========================================
# STAGE 2: Build Frontend
# ========================================
FROM base AS frontend-build

WORKDIR /app

# Copy built backend (para importar tipos)
COPY --from=backend-build /app/backend ./backend

# Install frontend dependencies
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend (agora consegue importar tipos do backend)
RUN npm run build

# ========================================
# STAGE 3: Production Backend
# ========================================
FROM base AS backend-production

WORKDIR /app

# Copy backend dependencies and built files
COPY --from=backend-build /app/backend/package*.json ./
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/src ./src
COPY backend/migrations ./migrations

# Create storage directories
RUN mkdir -p storage/audio storage/docs

EXPOSE 3001

CMD ["npm", "start"]

# ========================================
# STAGE 4: Production Frontend
# ========================================
FROM base AS frontend-production

WORKDIR /app

# Copy frontend built files
COPY --from=frontend-build /app/frontend/package*.json ./
COPY --from=frontend-build /app/frontend/dist ./dist
COPY --from=frontend-build /app/frontend/node_modules ./node_modules

EXPOSE 4173

CMD ["npm", "run", "preview"]
