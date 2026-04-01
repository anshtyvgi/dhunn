## ── Stage 1: Build backend ──────────────────────────────────────────
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate && npm run build

## ── Stage 2: Build frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./

# Next.js needs these at build time
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmlnaHQtbW9jY2FzaW4tMzQuY2xlcmsuYWNjb3VudHMuZGV2JA
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
RUN npm run build

## ── Stage 3: Production runtime ────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache tini

WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/prisma ./backend/prisma

# Copy frontend — include all files Next.js needs at runtime
COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-build /app/frontend/package.json ./frontend/
COPY --from=frontend-build /app/frontend/next.config.ts ./frontend/
COPY --from=frontend-build /app/frontend/src/middleware.ts ./frontend/src/middleware.ts

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Backend runs on internal port 4000, frontend on PORT (exposed to Render)
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ENV API_PREFIX=api
ENV FRONTEND_URL=http://localhost:10000

EXPOSE 10000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
