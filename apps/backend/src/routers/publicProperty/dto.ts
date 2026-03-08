import { z } from "zod";

export const listPublicPropertiesSchema = z
  .object({
    search: z.string().trim().min(1).max(120).optional(),
    location: z.string().trim().min(1).max(120).optional(),
    sharingType: z
      .enum([
        "single",
        "2-sharing",
        "3-sharing",
        "4-sharing",
        "5-sharing",
        "6-sharing",
      ])
      .optional(),
    propertyType: z
      .enum([
        "boys-hostel",
        "girls-hostel",
        "pg",
        "coliving",
        "apartments",
      ])
      .optional(),
    minPrice: z.number().int().min(0).optional(),
    maxPrice: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().trim().min(1).max(256).optional(),
  })
  .optional();

export const publicPropertyBySlugSchema = z.object({ slug: z.string().min(1) });
export const listLocationsSchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .optional();

export type ListPublicPropertiesType = z.infer<typeof listPublicPropertiesSchema>;
export type PublicPropertyBySlugType = z.infer<typeof publicPropertyBySlugSchema>;
export type ListLocationsType = z.infer<typeof listLocationsSchema>;
