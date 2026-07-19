import express from "express";
import { handleCheck } from "../controllers/check.controller.js";

export const checkRouter = express.Router();

checkRouter.get("/check", handleCheck);
