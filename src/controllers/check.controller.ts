import type { Request, Response } from "express";
import { logger } from "../config/logger.js";

export async function handleCheck(req: Request, res: Response) {
	logger.info(`Handling check`);
	res.status(200);
}
