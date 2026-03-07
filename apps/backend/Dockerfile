# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.5 AS deps
WORKDIR /app

# Install only production dependencies without mutating lockfiles in container.
COPY package.json ./
RUN bun install --production --no-save

FROM oven/bun:1.3.5 AS runtime
WORKDIR /app

ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# Runtime deps from deps stage + application source.
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json tsconfig.json drizzle.config.ts index.ts ./
COPY --chown=bun:bun src ./src
COPY --chown=bun:bun scripts ./scripts

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["bun", "run", "src/main.ts"]
