import { Redis } from "@upstash/redis";
import { logger } from "../config/logger.js";
import type { Bucket, Store } from "../types.js";

export const redis = Redis.fromEnv();

class RedisStore implements Store {
	async get(key: string) {
		logger.debug(`Getting key:${key} from redis`);
		const bucketStr: string | null = await redis.get(key);

		if (!bucketStr) {
			return undefined;
		}

		try {
			return JSON.parse(bucketStr) as Bucket;
		} catch (e) {
			logger.error(`Failed to parse redis key: ${key}\n${e}`);
			return undefined;
		}
	}

	async set(key: string, bucket: Bucket) {
		logger.debug(`Setting key:${key} in inMemoryStore`);
		await redis.set(key, bucket);
	}

	async del(key: string) {
		await redis.del(key);
	}
}

export default RedisStore;
