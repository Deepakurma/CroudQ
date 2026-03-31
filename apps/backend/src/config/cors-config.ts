import { type FastifyCorsOptions } from "@fastify/cors";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://www.croudq.com",
  "https://croudq.com",
  "https://main.dp5wz64tofctj.amplifyapp.com",
];

export const isAllowedOrigin = (origin: string) => {
  return ALLOWED_ORIGINS.includes(origin);
};

export const CorsConfig: FastifyCorsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-trpc-source",
    "X-Requested-With",
  ],
  maxAge: 86400,
};
