import app, { logger } from "./fastify";
import { createServer } from "./server/index";

const boot = async () => {
    try {
        const serverApp = await createServer(app);
        await serverApp.start();

        let shuttingDown = false;
        const handleShutdown = async (signal: string) => {
            if (shuttingDown) return;
            shuttingDown = true;

            logger.info({ signal }, "Received shutdown signal");
            await serverApp.stop();
            process.exit(0);
        };

        process.on("SIGINT", () => {
            void handleShutdown("SIGINT");
        });

        process.on("SIGTERM", () => {
            void handleShutdown("SIGTERM");
        });
    } catch (error) {
        logger.error({ error }, "Failed to start application");
        process.exit(1);
    }
};

void boot();
