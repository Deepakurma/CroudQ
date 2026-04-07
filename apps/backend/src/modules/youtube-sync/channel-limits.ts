import { eq } from "drizzle-orm";

import { db } from "../../db";
import { users, type ChannelType } from "../../db/schema";

const DEFAULT_CHANNEL_TYPE: ChannelType = "small";

export const CHANNEL_LIMITS = {
  small: {
    commentsPerVideo: 200,
    videoRegenThreshold: 50,
    aggregateRegenThreshold: 50,
  },
  medium: {
    commentsPerVideo: 500,
    videoRegenThreshold: 150,
    aggregateRegenThreshold: 150,
  },
} as const;

export type ChannelLimits =
  (typeof CHANNEL_LIMITS)[keyof typeof CHANNEL_LIMITS];

export const getChannelLimitsForChannelType = (
  channelType: ChannelType | null | undefined,
): ChannelLimits =>
  CHANNEL_LIMITS[channelType ?? DEFAULT_CHANNEL_TYPE] ??
  CHANNEL_LIMITS[DEFAULT_CHANNEL_TYPE];

export const getChannelLimitsForUser = async (
  userId: string,
): Promise<ChannelLimits> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      channelType: true,
    },
  });

  return getChannelLimitsForChannelType(user?.channelType);
};
