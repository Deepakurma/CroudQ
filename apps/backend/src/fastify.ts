import { randomUUID } from "crypto";
import Fastify from "fastify";

const app = Fastify({
    logger:
        process.env.NODE_ENV === "production"
            ? true
            : {
                transport: {
                    target: "pino-pretty",
                    options: {
                        translateTime: "HH:MM:ss Z",
                        ignore: "pid,hostname",
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
    genReqId: (req) => {
        const headerValue = req.headers["x-request-id"];
        return typeof headerValue === "string" && headerValue.trim().length > 0
            ? headerValue
            : randomUUID();
    },
});

export const logger = app.log;
export default app;
