import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { logger } from "../fastify";
import * as schema from "./schema/index";

import type { SQLOptions } from "bun";
import type { Logger } from "drizzle-orm/logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as unknown as {
  conn: SQL | undefined;
};

class CustomDbLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    logger.info({
      msg: "Executing SQL query",
      query,
      params,
    });
  }
}

export const conn =
  globalForDb.conn ??
  new SQL({
    url: process.env.DATABASE_URL,
    onclose: () => {
      logger.info("Disconnected from database");
    },
    search_path: "public",
  } as SQLOptions);

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
  schema,
  logger: new CustomDbLogger(),
  casing: "snake_case",
});
export * from "./schema/index";
