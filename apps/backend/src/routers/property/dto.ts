import { z } from "zod";

const priceStringSchema = z
  .string()
  .regex(/^[0-9]+$/)
  .refine((v) => Number(v) > 0, "Price must be greater than 0")
  .refine((v) => Number(v) <= 200000, "Price cannot exceed 2,00,000");

const facilitiesSchema = z.object({
  electricity: z.boolean(),
  hotWater: z.boolean(),
  wifi: z.boolean(),
  ac: z.boolean(),
  powerBackup: z.boolean(),
  lift: z.boolean(),
  parking: z.boolean(),
  food: z.boolean(),
  laundry: z.boolean(),
  housekeeping: z.boolean(),
  cctv: z.boolean(),
});

export const createPropertySchema = z.object({
  propertyName: z.string().trim().min(3).max(120),
  inchargeName: z.string().trim().min(3).max(80),
  inchargePhone: z.string().regex(/^[0-9]{10}$/),
  type: z.string().trim().min(1).max(50),
  address1: z.string().trim().min(1).max(400),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[0-9]{6}$/),
  area: z.string().trim().max(120),
  mapsLink: z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Invalid URL",
    }),
  landmarks: z.array(z.string().trim().min(1).max(120)).max(20),
  floors: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .refine((v) => Number(v) <= 50),
  includeGroundFloor: z.boolean(),
  roomsPerFloor: z.record(z.string(), z.string().regex(/^[0-9]+$/)),
  roomTypes: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  rents: z.record(z.string(), z.string().regex(/^[0-9]+$/)),
  facilities: facilitiesSchema,
  rules: z.array(z.string().trim().min(1).max(300)).max(50),
  photos: z.array(z.string().trim().max(2_000_000)).max(5),
});

export const updateRoomSchema = z.object({
  roomId: z.string(),
  type: z.string().optional(),
  isAc: z.boolean().optional(),
  price: priceStringSchema.optional(),
  roomNumber: z.string().optional(),
});

export const updateRoomsBulkSchema = z.object({
  roomIds: z.array(z.string()).min(1),
  type: z.string().optional(),
  isAc: z.boolean().optional(),
  price: priceStringSchema.optional(),
});

export const getRoomsSchema = z
  .object({
    status: z.enum(["all", "available", "occupied"]).optional(),
    q: z.string().trim().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(500).optional(),
    scopePropertyId: z.string().trim().min(1).optional(),
  })
  .optional();

export const listPropertiesSchema = z
  .object({
    limit: z.number().int().min(1).max(200).optional(),
  })
  .optional();

export const renumberFloorRoomsSchema = z.object({
  floorNumber: z.number(),
  prefix: z.string(),
  startNumber: z.number(),
  padding: z.number().optional(),
});

export const addRoomSchema = z.object({
  floorNumber: z.number(),
  roomNumber: z.string(),
  type: z.string(),
  isAc: z.boolean(),
  price: priceStringSchema,
});

export const updatePropertySchema = z.object({
  propertyName: z.string().trim().min(3).max(120),
  inchargeName: z.string().trim().min(3).max(80),
  inchargePhone: z.string().regex(/^[0-9]{10}$/),
  type: z.string().trim().min(1).max(50),
  address1: z.string().trim().min(1).max(400),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^[0-9]{6}$/),
  area: z.string().trim().max(120),
  mapsLink: z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Invalid URL",
    }),
  landmarks: z.array(z.string().trim().min(1).max(120)).max(20),
  roomTypes: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  rents: z.record(z.string(), z.string().regex(/^[0-9]+$/)),
  facilities: facilitiesSchema,
  rules: z.array(z.string().trim().min(1).max(300)).max(50),
  photos: z.array(z.string().trim().max(2_000_000)).max(5),
});

export const updateRoomStructureSchema = z.object({
  floors: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .refine((v) => Number(v) <= 50),
  includeGroundFloor: z.boolean(),
  roomsPerFloor: z.record(z.string(), z.string().regex(/^[1-9][0-9]*$/)),
});

export const updateInchargeSchema = z.object({
  inchargeName: z
    .string()
    .trim()
    .min(3, "Incharge name must be at least 3 characters")
    .max(80, "Incharge name cannot exceed 80 characters"),
  inchargePhone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number (10 digits required)"),
});

export type CreatePropertyType = z.infer<typeof createPropertySchema>;
export type UpdateRoomType = z.infer<typeof updateRoomSchema>;
export type UpdateRoomsBulkType = z.infer<typeof updateRoomsBulkSchema>;
export type GetRoomsType = z.infer<typeof getRoomsSchema>;
export type ListPropertiesType = z.infer<typeof listPropertiesSchema>;
export type RenumberFloorRoomsType = z.infer<typeof renumberFloorRoomsSchema>;
export type AddRoomType = z.infer<typeof addRoomSchema>;
export type UpdatePropertyType = z.infer<typeof updatePropertySchema>;
export type UpdateInchargeType = z.infer<typeof updateInchargeSchema>;
