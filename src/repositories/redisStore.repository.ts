import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import type {
	Bucket,
	BucketConfig,
	Config,
	SlidingWindowConfig,
	Store,
} from "../types.js";

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
	async get(key: string) {
		const bucket = await redis.get<Bucket>(key);

		if (!bucket) {
			return undefined;
		}

		return bucket;
	}

	async set(key: string, bucket: Bucket) {
		await redis.set(key, JSON.stringify(bucket));
	}

	async del(key: string) {
		await redis.del(key);
	}

	async check(
		key: string,
		config: Config,
	): Promise<{ allowed: boolean; remaining: number }> {
		const now = Date.now();
		const result = await redis.eval(
			TOKEN_BUCKET_SCRIPT,
			[key],
			[
				config.tokenBucket.capacity.toString(),
				config.tokenBucket.refillRate.toString(),
				now.toString(),
			],
		);
		return result as { allowed: boolean; remaining: number };
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
