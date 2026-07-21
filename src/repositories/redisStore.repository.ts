import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import type { BucketConfig, SlidingWindowConfig, Store } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_BUCKET_SCRIPT = readFileSync(
	join(__dirname, "../scripts/redisTokenBucket.script.lua"),
	"utf-8",
);
const SLIDING_WINDOW_SCRIPT = readFileSync(
	join(__dirname, "../scripts/redisSlidingWindow.script.lua"),
	"utf-8",
);
export const redis = Redis.fromEnv();

class RedisStore implements Store {
	// Used for testing
	async del(key: string) {
		await redis.del(key);
	}

	async checkWithTokenBucket(
		key: string,
		config: BucketConfig,
	): Promise<boolean> {
		const now = Date.now();
		const result = await redis.eval(
			TOKEN_BUCKET_SCRIPT,
			[key],
			[
				config.capacity.toString(),
				config.refillRate.toString(),
				now.toString(),
			],
		);

		if (result) return true;
		return false;
	}
	async checkWithSlidingWindow(key: string, config: SlidingWindowConfig) {
		const result = await redis.eval(
			SLIDING_WINDOW_SCRIPT,
			[key],
			[config.windowSize, config.maxRequests, Date.now().toString()],
		);

		if (result) return true;
		return false;
	}
}

export default RedisStore;
