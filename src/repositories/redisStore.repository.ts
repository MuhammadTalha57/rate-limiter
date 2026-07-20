import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import type { Bucket, Config, Store } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_BUCKET_SCRIPT = readFileSync(
	join(__dirname, "../scripts/redisTokenBucket.lua"),
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
}

export default RedisStore;
