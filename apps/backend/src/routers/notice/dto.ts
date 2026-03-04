import { z } from "zod";

export const listNoticesSchema = z
    .object({
        limit: z.number().int().min(1).max(200).optional(),
        scopePropertyId: z.string().trim().min(1).optional(),
    })
    .optional();

export const createNoticeSchema = z.object({
    title: z.string(),
    description: z.string(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
});

export const noticeIdSchema = z.object({ id: z.string() });

export type ListNoticesType = z.infer<typeof listNoticesSchema>;
export type CreateNoticeType = z.infer<typeof createNoticeSchema>;
export type NoticeIdType = z.infer<typeof noticeIdSchema>;
