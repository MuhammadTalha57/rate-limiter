import type { Config } from "../types.js";

export const defaultConfig: Config = {
	algorithm: "tokenBucket",
	tokenBucket: {
		capacity: 100,
		refillRate: 10,
	},
	slidingWindow: {
		windowSize: 1 * 60 * 1000, // 1 Minute
		maxRequests: 100,
	},
};
