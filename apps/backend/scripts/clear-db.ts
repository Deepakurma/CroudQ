import { sql } from "drizzle-orm";
import { db } from "../src/db";

type PgTableRow = {
  tablename: string;
};

const requireConfirmation = () => {
  if (!process.argv.includes("--yes")) {
    console.error("Refusing to clear the database without --yes");
    console.error("Run: bun --env-file=.env scripts/clear-db.ts --yes");
    process.exit(1);
  }
};

const quoteIdentifier = (value: string) =>
  `"${value.replaceAll('"', '""')}"`;

const main = async () => {
  requireConfirmation();

  const result = await db.execute<PgTableRow>(sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  const tableNames = Array.from(result).map((row) => row.tablename);

  if (tableNames.length === 0) {
    console.log("No tables found.");
    return;
  }

  const truncateStatement = `
    TRUNCATE TABLE ${tableNames.map(quoteIdentifier).join(", ")}
    RESTART IDENTITY
    CASCADE
  `;

  await db.execute(sql.raw(truncateStatement));

  console.log(`Cleared ${tableNames.length} tables.`);
};

void main()
  .catch((error) => {
    console.error("Failed to clear database tables");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end?.();
  });