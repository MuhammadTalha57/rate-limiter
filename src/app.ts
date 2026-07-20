import type { Request, Response } from "express";
import express from "express";
import "dotenv/config";
import { defaultConfig } from "./config/defaultConfig.js";
import { logger } from "./config/logger.js";
import { redis } from "./repositories/redisStore.repository.js";
import store from "./repositories/store.repository.js";
import { checkRouter } from "./routes/check.route.js";
import createTokenBucket from "./services/tokenBucket.service.js";

export const limiter = createTokenBucket(defaultConfig.tokenBucket, store);

const app = express();

app.use(express.json());

app.use("", checkRouter);

app.get("/health", async (_req: Request, res: Response) => {
	let isHealthy = true;

	// Check Redis Connection
	try {
		const pong = await redis.ping();
		isHealthy = pong === "PONG";
	} catch (e) {
		isHealthy = false;
		logger.error(`[Health] System is unhealthy and down: ${e}`);
		res.status(503).json({ ok: isHealthy, redis: "DOWN" });
	}

	if (isHealthy) {
		logger.info(`[Health] System is health and running.`);
		res.status(200).json({ ok: isHealthy, redis: "UP" });
	} else {
		logger.error(`[Health] System is unhealthy and down.`);
		res.status(503).json({ ok: isHealthy, redis: "DOWN" });
	}
});

export default app;
