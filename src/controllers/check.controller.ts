import type { Request, Response } from "express";
import { limiter } from "../app.js";
import { logger } from "../config/logger.js";
import type { Config } from "../types.js";

export async function checkController(req: Request, res: Response) {
	const { key, overrides }: { key: string; overrides: Partial<Config> } =
		req.body;
	if (!key) {
		res.sendStatus(400);
	}
	logger.info(`Handling check for key:${key}`);

	const result = await limiter.check(key, { ...overrides });
	
	res.json({ allowed: result }).send();
}