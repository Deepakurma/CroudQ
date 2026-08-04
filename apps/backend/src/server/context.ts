import "@fastify/cookie";
import "../utils/fastify-jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

interface ExtendedContextOptions {
  req: FastifyRequest;
  res: FastifyReply;
}

export async function createContext({ req, res }: ExtendedContextOptions) {
  return { req, res, user: req.user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
