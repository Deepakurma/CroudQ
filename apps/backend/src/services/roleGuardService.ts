import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { properties, residents } from "../db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const hasVendorRole = async (tx: DbTransaction, userId: string): Promise<boolean> => {
    const property = await tx.query.properties.findFirst({
        columns: { id: true },
        where: eq(properties.userId, userId),
    });
    return Boolean(property);
};

const hasActiveResidentRole = async (tx: DbTransaction, userId: string): Promise<boolean> => {
    const resident = await tx.query.residents.findFirst({
        columns: { id: true },
        where: and(
            eq(residents.userId, userId),
            eq(residents.active, true),
            eq(residents.status, "active"),
        ),
    });
    return Boolean(resident);
};

export const roleGuardService = {
    async assertCanBeResident(tx: DbTransaction, userId: string): Promise<void> {
        if (await hasVendorRole(tx, userId)) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "This account is already a vendor and cannot be onboarded as a resident.",
            });
        }
    },

    async assertCanBeVendor(tx: DbTransaction, userId: string): Promise<void> {
        if (await hasActiveResidentRole(tx, userId)) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "This account is already an active resident and cannot be onboarded as a vendor.",
            });
        }
    },
};
