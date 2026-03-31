import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { admins, userCredentials, users } from "../src/db/schema";

const PASSWORD_SALT_ROUNDS = 12;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const existingAdmin = await db.query.admins.findFirst();
  if (existingAdmin) {
    throw new Error("An admin already exists. Use the admin signup flow instead.");
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (existingUser) {
    throw new Error("A user with ADMIN_EMAIL already exists. Set a different email.");
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const now = new Date();

  await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name,
        updatedAt: now,
      })
      .returning();

    await tx.insert(userCredentials).values({
      userId: createdUser.id,
      passwordHash,
      updatedAt: now,
    });

    await tx.insert(admins).values({
      userId: createdUser.id,
      isActive: true,
      updatedAt: now,
    });
  });

  console.log(`First admin created: ${normalizedEmail}`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end();
  });
