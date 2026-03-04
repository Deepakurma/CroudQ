import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { residents, users } from "../db/schema";
import { roleGuardService } from "./roleGuardService";
import { normalizeIndianPhone } from "../utils/phone";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ensureUserByPhone = async (
  tx: DbTransaction,
  rawPhoneNumber: string,
): Promise<typeof users.$inferSelect> => {
  const phoneNumber = normalizeIndianPhone(rawPhoneNumber);
  const existing = await tx.query.users.findFirst({
    where: eq(users.phoneNumber, phoneNumber),
  });

  if (existing) {
    return existing;
  }

  const userId = crypto.randomUUID();
  const [created] = await tx
    .insert(users)
    .values({
      id: userId,
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
};

const assertNoOtherActiveResident = async (
  tx: DbTransaction,
  userId: string,
  excludeResidentId?: string,
): Promise<void> => {
  const existingActive = await tx.query.residents.findFirst({
    columns: { id: true },
    where: excludeResidentId
      ? and(
          eq(residents.userId, userId),
          eq(residents.active, true),
          ne(residents.id, excludeResidentId),
        )
      : and(eq(residents.userId, userId), eq(residents.active, true)),
  });

  if (existingActive) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This user already has an active resident profile. End the existing tenancy before onboarding again.",
    });
  }
};

export const residentIdentityService = {
  normalizePhone(rawPhoneNumber: string): string {
    return normalizeIndianPhone(rawPhoneNumber);
  },

  async resolveResidentForAuthenticatedUser(userId: string) {
    return db.query.residents.findFirst({
      where: and(
        eq(residents.userId, userId),
        eq(residents.active, true),
        eq(residents.status, "active"),
      ),
    });
  },

  async ensureOnboardingAllowedAndResolveUser(
    tx: DbTransaction,
    rawPhoneNumber: string,
  ): Promise<{ userId: string; phoneNumber: string }> {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);
    const user = await ensureUserByPhone(tx, phoneNumber);
    await roleGuardService.assertCanBeResident(tx, user.id);
    await assertNoOtherActiveResident(tx, user.id);

    return {
      userId: user.id,
      phoneNumber,
    };
  },

  async validateResidentUpdatePhone(
    tx: DbTransaction,
    residentId: string,
    rawPhoneNumber: string,
  ): Promise<{ userId: string; phoneNumber: string }> {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);
    const user = await ensureUserByPhone(tx, phoneNumber);
    await roleGuardService.assertCanBeResident(tx, user.id);
    await assertNoOtherActiveResident(tx, user.id, residentId);

    return {
      userId: user.id,
      phoneNumber,
    };
  },
};
