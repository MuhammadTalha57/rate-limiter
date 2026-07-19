import type { Request, Response } from "express";
import express from "express";
import "dotenv/config";
import { defaultConfig } from "./config/defaultConfig.js";
import store from "./repositories/memoryStore.repository.js";
import { checkRouter } from "./routes/check.route.js";
import createTokenBucket from "./services/tokenBucket.service.js";

export const limiter = createTokenBucket(defaultConfig.tokenBucket, store);

const app = express();

app.use("", checkRouter);

app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

export default app;
