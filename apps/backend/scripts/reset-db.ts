
import { sql } from "drizzle-orm";

import { db } from "../src/db";

async function main() {
    console.log("Resetting database...");

    // Truncate all tables
    // Use 'CASCADE' to clear dependent tables automatically
    // Use 'RESTART IDENTITY' to reset auto-increment counters (though UUIDs are used mostly)

    // List of tables to truncate (keep in sync with src/db/schema/*)
    const tables = [
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

    /* 
     * Construct a single SQL statement to truncate all tables.
     * "TRUNCATE TABLE table1, table2, ... RESTART IDENTITY CASCADE;"
     */
    const query = sql.raw(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`);

    try {
        await db.execute(query);
        console.log("Database reset successfully.");
    } catch (error) {
        console.error("Error resetting database:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
