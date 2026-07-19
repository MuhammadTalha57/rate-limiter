import express from "express";
import { checkController } from "../controllers/check.controller.js";

export const checkRouter = express.Router();

checkRouter.post("/check", checkController);
