import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { logger } from "../fastify";
import * as schema from "./schema";

import type { SQLOptions } from "bun";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const conn = new SQL({
  url: process.env.DATABASE_URL,
  onclose: () => {
    logger.info("Disconnected from database");
  },
  search_path: "public",
} as SQLOptions);

const isDevelopment = process.env.NODE_ENV === "development";

export const db = drizzle(conn, {
  schema,
  logger: isDevelopment
    ? {
        logQuery(query, params) {
          logger.info({ query, params });
        },
      }
    : false,
  casing: "snake_case",
});
export * from "./schema";
