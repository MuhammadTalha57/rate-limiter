import type { Request, Response } from "express";
import express from "express";
import "dotenv/config";
import { checkRouter } from "./routes/check.route.js";

const app = express();

app.use("/", checkRouter);

app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

app.get(
	"/.well-known/appspecific/com.chrome.devtools.json",
	(req: Request, res: Response) => {
		res.status(204).end(); // Returns 204 No Content, satisfying Chrome silently
	},
);

export default app;
