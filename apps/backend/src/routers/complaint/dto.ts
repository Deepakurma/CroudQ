import { z } from "zod";

export const listComplaintsSchema = z
    .object({
        status: z.enum(["pending", "resolved"]).optional(),
        q: z.string().trim().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(200).optional(),
        scopePropertyId: z.string().trim().min(1).optional(),
    })
    .optional();

export const createComplaintSchema = z.object({
    residentId: z.string().optional(),
    roomId: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
});

export const complaintIdSchema = z.object({ id: z.string() });

export type ListComplaintsType = z.infer<typeof listComplaintsSchema>;
export type CreateComplaintType = z.infer<typeof createComplaintSchema>;
export type ComplaintIdType = z.infer<typeof complaintIdSchema>;
