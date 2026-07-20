import type { Request, Response } from "express";
import { limiter } from "../app.js";
import { logger } from "../config/logger.js";
import type { Config } from "../types.js";

export async function checkController(req: Request, res: Response) {
	const { key, config }: { key: string; config: Config } = req.body;
	if (!key) {
		res.sendStatus(400);
	}
	logger.info(`Handling check for key:${key}`);

	const result = await limiter.check(key, { ...config.tokenBucket });

	res.json({ ...result }).send();
}
