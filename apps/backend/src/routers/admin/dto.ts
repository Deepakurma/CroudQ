import { z } from "zod";

export const idSchema = z.object({ id: z.string().min(1) });

export const setLandlordFreezeSchema = z.object({
    id: z.string().min(1),
    isFrozen: z.boolean(),
    freezeReason: z.string().trim().max(500).optional(),
});

export const listLandlordsSchema = z
    .object({
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
        q: z.string().trim().min(1).max(200).optional(),
    })
    .optional();

export const listQueriesSchema = z
    .object({
        limit: z.number().int().min(1).max(500).optional(),
        q: z.string().trim().min(1).max(200).optional(),
    })
    .optional();

export const listFeedbacksSchema = z
    .object({
        limit: z.number().int().min(1).max(500).optional(),
        q: z.string().trim().min(1).max(200).optional(),
    })
    .optional();

export const submitLandlordQuerySchema = z.object({
    query: z.string().trim().min(3).max(2000),
});

export const submitFeedbackSchema = z.object({
    rating: z.number().int().min(1).max(5),
    description: z.string().trim().max(2000).optional(),
});

export type IdType = z.infer<typeof idSchema>;
export type SetLandlordFreezeType = z.infer<typeof setLandlordFreezeSchema>;
export type ListLandlordsType = z.infer<typeof listLandlordsSchema>;
export type ListQueriesType = z.infer<typeof listQueriesSchema>;
export type ListFeedbacksType = z.infer<typeof listFeedbacksSchema>;
export type SubmitLandlordQueryType = z.infer<typeof submitLandlordQuerySchema>;
export type SubmitFeedbackType = z.infer<typeof submitFeedbackSchema>;
