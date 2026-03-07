import { sql } from "drizzle-orm";

import { db } from "../src/db";

const expectedTables = [
    // Auth
    "user",
    "super_admin",
    "otp_rate",
    "revoked_token",

    // Property domain
    "property",
    "property_facility",
    "property_room_type",
    "room",

    // Resident domain
    "resident",
    "resident_payment",
    "resident_join_request",

    // Communication / ops
    "complaint",
    "notice",
    "checkout",
    "support_query",
    "feedback",
];

async function main() {
    console.log("Checking database tables...");

    const expectedSet = new Set(expectedTables);
    const quotedNames = expectedTables.map((name) => `'${name}'`).join(", ");

    const result = await db.execute(
        sql.raw(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (${quotedNames});
        `),
    );

    const rows = result.rows as Array<{ table_name: string }>;
    const presentTables = rows.map((row) => row.table_name);
    const presentSet = new Set(presentTables);

    const missingTables = expectedTables.filter((name) => !presentSet.has(name));
    const extraMatchedTables = presentTables.filter((name) => expectedSet.has(name));

    console.log(`Expected: ${expectedTables.length}`);
    console.log(`Present: ${extraMatchedTables.length}`);

    if (missingTables.length > 0) {
        console.error("Missing tables:");
        for (const table of missingTables) {
            console.error(`- ${table}`);
        }
        process.exit(1);
    }

    console.log("All expected tables are present.");
    process.exit(0);
}

main().catch((error) => {
    console.error("Failed to check tables:", error);
    process.exit(1);
});
