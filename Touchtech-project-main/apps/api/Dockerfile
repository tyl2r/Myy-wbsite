# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

RUN apt-get update -y && apt-get install -y openssl

COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# ---- Production stage ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NODE_ENV=production

# install only production deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# install openssl again (needed for prisma)
RUN apt-get update -y && apt-get install -y openssl

# copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# expose port (important for Railway)
EXPOSE 3000

# start app
CMD ["node", "dist/main.js"]
