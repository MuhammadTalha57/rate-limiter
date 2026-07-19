import type { Request, Response } from "express";
import express from "express";
import "dotenv/config";
import { checkRouter } from "./routes/check.route.js";

const app = express();

app.use("/", checkRouter);

app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

export default app;
