# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.5 AS deps
WORKDIR /app

# Install only production dependencies without mutating lockfiles in container.
COPY package.json ./
RUN bun install --production --no-save

FROM oven/bun:1.3.5 AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

# Run as the non-root Bun user provided by the base image.
USER bun

# Runtime deps from deps stage + application source.
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json tsconfig.json drizzle.config.ts index.ts ./
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun scripts ./scripts

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["bun", "run", "src/main.ts"]
