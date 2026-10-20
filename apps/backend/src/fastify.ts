import Fastify from "fastify";

const app = Fastify({
  maxParamLength: 2500,
  logger:
    process.env.NODE_ENV === "production"
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: {
              translateTime: "SYS:standard",
              colorize: true,
            },
          },
          serializers: {
            req(req) {
              return {
                id: req.id,
                method: req.method,
                url: req.url,
              };
            },
          },
        },
});

export const logger = app.log;
export default app;
