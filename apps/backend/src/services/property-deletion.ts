import { and, eq, isNotNull, lte } from "drizzle-orm";

import { db } from "../db";
import {
  checkouts,
  properties,
  residentJoinRequests,
  residents,
} from "../db/schema";
import { deleteS3Object, resolveManagedS3KeyForProperty } from "./s3-sender";

export const PROPERTY_DELETION_GRACE_DAYS = 3;
const PROPERTY_DELETION_GRACE_MS = PROPERTY_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

type LoggerLike = {
  error: (payload: unknown, message?: string) => void;
  info: (payload: unknown, message?: string) => void;
};

const buildScheduledDeletionDate = (now: Date) =>
  new Date(now.getTime() + PROPERTY_DELETION_GRACE_MS);

export const schedulePropertyDeletion = async (
  propertyId: string,
  userId: string,
) => {
  const now = new Date();

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
  });

  if (!property) {
    return null;
  }

  if (property.deletionScheduledFor && property.deletionScheduledFor > now) {
    return {
      scheduledFor: property.deletionScheduledFor,
      alreadyScheduled: true,
    };
  }

  const scheduledFor = buildScheduledDeletionDate(now);

  const [updated] = await db
    .update(properties)
    .set({
      deletionRequestedAt: now,
      deletionScheduledFor: scheduledFor,
      updatedAt: now,
    })
    .where(and(eq(properties.id, propertyId), eq(properties.userId, userId)))
    .returning({
      deletionScheduledFor: properties.deletionScheduledFor,
    });

  if (!updated?.deletionScheduledFor) {
    return null;
  }

  return {
    scheduledFor: updated.deletionScheduledFor,
    alreadyScheduled: false,
  };
};

export const cancelPropertyDeletion = async (propertyId: string, userId: string) => {
  const [updated] = await db
    .update(properties)
    .set({
      deletionRequestedAt: null,
      deletionScheduledFor: null,
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, propertyId), eq(properties.userId, userId)))
    .returning({
      id: properties.id,
    });

  return Boolean(updated);
};

const collectManagedS3KeysForProperty = async (propertyId: string) => {
  return db.transaction(async (tx) => {
    const propertyRecord = await tx.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    });

    if (!propertyRecord) {
      return { keys: [], deleted: false };
    }

    const now = new Date();
    if (
      !propertyRecord.deletionScheduledFor ||
      propertyRecord.deletionScheduledFor > now
    ) {
      return { keys: [], deleted: false };
    }

    const [residentImages, checkoutImages, joinRequestImages] = await Promise.all([
      tx
        .select({ image: residents.profileImage })
        .from(residents)
        .where(eq(residents.propertyId, propertyId)),
      tx
        .select({ image: checkouts.profileImage })
        .from(checkouts)
        .where(eq(checkouts.propertyId, propertyId)),
      tx
        .select({ image: residentJoinRequests.submittedProfileImage })
        .from(residentJoinRequests)
        .where(eq(residentJoinRequests.propertyId, propertyId)),
    ]);

    const keySet = new Set<string>();
    const addKey = (value: string | null | undefined) => {
      const key = resolveManagedS3KeyForProperty(value, propertyId);
      if (key) {
        keySet.add(key);
      }
    };

    for (const photo of propertyRecord.photos || []) {
      addKey(photo);
    }
    for (const item of residentImages) {
      addKey(item.image);
    }
    for (const item of checkoutImages) {
      addKey(item.image);
    }
    for (const item of joinRequestImages) {
      addKey(item.image);
    }

    const deleted = await tx
      .delete(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          isNotNull(properties.deletionScheduledFor),
          lte(properties.deletionScheduledFor, now),
        ),
      )
      .returning({ id: properties.id });

    return {
      keys: Array.from(keySet),
      deleted: deleted.length > 0,
    };
  });
};

export const finalizeScheduledPropertyDeletion = async (
  propertyId: string,
  logger?: LoggerLike,
) => {
  const { keys, deleted } = await collectManagedS3KeysForProperty(propertyId);

  if (!deleted) {
    return false;
  }

  if (keys.length > 0) {
    const deleteResults = await Promise.allSettled(
      keys.map((key) => deleteS3Object(key)),
    );
    deleteResults.forEach((result, index) => {
      if (result.status === "rejected") {
        logger?.error(
          { key: keys[index], error: result.reason },
          "Failed to delete S3 object after scheduled property deletion",
        );
      }
    });
  }

  return true;
};

export const finalizeDuePropertyDeletions = async (logger?: LoggerLike) => {
  const now = new Date();
  const dueProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(
      and(
        isNotNull(properties.deletionScheduledFor),
        lte(properties.deletionScheduledFor, now),
      ),
    );

  let deletedCount = 0;
  for (const property of dueProperties) {
    try {
      const deleted = await finalizeScheduledPropertyDeletion(property.id, logger);
      if (deleted) {
        deletedCount += 1;
      }
    } catch (error) {
      logger?.error(
        { propertyId: property.id, error },
        "Failed to finalize scheduled property deletion",
      );
    }
  }

  if (deletedCount > 0) {
    logger?.info(
      { deletedCount },
      "Finalized scheduled property deletions",
    );
  }

  return { deletedCount };
};
