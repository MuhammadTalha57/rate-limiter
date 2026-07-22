import type { Request, Response } from "express";
import express from "express";
import "dotenv/config";
import { defaultConfig } from "./config/defaultConfig.js";
import { logger } from "./config/logger.js";
import { redis } from "./repositories/redisStore.repository.js";
import store from "./repositories/store.repository.js";
import { checkRouter } from "./routes/check.route.js";
import createRateLimiter from "./services/rateLimiter.service.js";

const STORE_TYPE = process.env.STORE_TYPE;
export const limiter = createRateLimiter(store, defaultConfig);

const app = express();

app.use(express.json());

app.use("", checkRouter);

app.get("/health", async (_req: Request, res: Response) => {
	let isHealthy = true;

	// Check Redis Connection
	if (STORE_TYPE === "Redis") {
		try {
			const pong = await redis.ping();
			isHealthy = pong === "PONG";
		} catch (e) {
			isHealthy = false;
			logger.error(`[Health] System is unhealthy and down: ${e}`);
			res.status(503).json({ ok: isHealthy });
		}
	}

	if (isHealthy) {
		logger.info(`[Health] System is healthy and running.`);
		res.status(200).json({ ok: isHealthy });
	} else {
		logger.error(`[Health] System is unhealthy and down.`);
		res.status(503).json({ ok: isHealthy });
	}
});

export default app;
