import type { Request, Response } from "express";
import { limiter } from "../app.js";
import { logger } from "../config/logger.js";

export async function checkController(req: Request, res: Response) {
	const { key, config }: { key: string; config: Record<any, any> } = req.body;
	if (!key) {
		res.status(400);
	}
	logger.info(`Handling check for key:${key}`);

	const result = limiter.check(key, { ...config });

	res.json(result);
}
