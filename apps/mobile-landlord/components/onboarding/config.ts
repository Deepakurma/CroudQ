import { z } from "zod";

export const step1Schema = z.object({
  propertyName: z.string().min(3, "Property name must be at least 3 characters"),
  inchargeName: z
    .string()
    .min(3, "InchargeName name must be at least 3 characters"),
  inchargePhone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number (10 digits required)"),
  type: z.enum(["Boys", "Girls", "Co-living", "PG"]),
});

export const step2Schema = z.object({
  address1: z.string().min(1, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Invalid Pincode"),
});

export const step3Schema = z.object({
  floors: z
    .string()
    .regex(/^[1-9][0-9]*$/, "Enter a valid number of floors")
    .refine((val) => parseInt(val, 10) <= 50, "Floors cannot exceed 50"),
});

export const STEPS = [
  { title: "Basic Info", id: 1 },
  { title: "Location", id: 2 },
  { title: "Property", id: 3 },
  { title: "Facilities", id: 4 },
  { title: "Rules", id: 5 },
  { title: "Photos", id: 6 },
  { title: "Review", id: 7 },
] as const;

export const ROOM_TYPES = [
  "Single",
  "2-Sharing",
  "3-Sharing",
  "4-Sharing",
  "5-Sharing",
  "6-Sharing",
] as const;

export type OnboardingFormData = {
  propertyName: string;
  inchargeName: string;
  inchargePhone: string;
  type: "Boys" | "Girls" | "Co-living" | "PG";
  address1: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  mapsLink: string;
  floors: string;
  includeGroundFloor: boolean;
  roomsPerFloor: Record<string, string>;
  roomTypes: string[];
  rents: Record<string, string>;
  electricity: boolean;
  hotWater: boolean;
  wifi: boolean;
  ac: boolean;
  powerBackup: boolean;
  lift: boolean;
  parking: boolean;
  food: boolean;
  laundry: boolean;
  housekeeping: boolean;
  cctv: boolean;
  photos: string[];
  landmarks: string[];
  rules: string[];
};

export const createInitialOnboardingFormData = (): OnboardingFormData => ({
  propertyName: "",
  inchargeName: "",
  inchargePhone: "",
  type: "Boys",
  address1: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  mapsLink: "",
  floors: "",
  includeGroundFloor: true,
  roomsPerFloor: {},
  roomTypes: [],
  rents: {},
  electricity: true,
  hotWater: false,
  wifi: true,
  ac: false,
  powerBackup: false,
  lift: false,
  parking: false,
  food: true,
  laundry: false,
  housekeeping: true,
  cctv: true,
  photos: [],
  landmarks: [],
  rules: [],
});
