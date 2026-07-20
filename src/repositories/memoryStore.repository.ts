import { logger } from "../config/logger.js";
import type { Bucket, Config, Store } from "../types.js";

const inMemoryStore: Record<string, { tokens: number; lastUpdated: number }> =
	{};

class MemoryStore implements Store {
	async get(key: string) {
		logger.debug(`Getting key:${key} from inMemoryStore`);
		const bucket = inMemoryStore[key];
		return bucket;
	}

	async set(key: string, bucket: Bucket) {
		logger.debug(`Setting key:${key} in inMemoryStore`);
		inMemoryStore[key] = bucket;
	}

	async del(key: string) {
		delete inMemoryStore[key];
	}

	async check(
		key: string,
		config: Config,
	): Promise<{ allowed: boolean; remaining: number }> {
		let result: { allowed: boolean; remaining: number };

		const capacity = config.tokenBucket.capacity;
		const refillRate = config.tokenBucket.refillRate;
		let bucket = await this.get(key);

		if (bucket === undefined) {
			bucket = { tokens: capacity, lastUpdated: Date.now() };
			await this.set(key, bucket);
		}

		const elapsedSeconds = Math.floor((Date.now() - bucket.lastUpdated) / 1000);
		const newTokenCount = Math.min(
			capacity,
			bucket.tokens + refillRate * elapsedSeconds,
		);
		bucket.tokens = newTokenCount;
		bucket.lastUpdated += elapsedSeconds * 1000;

		if (bucket.tokens >= 1) {
			// Consume
			bucket.tokens--;
			this.set(key, bucket);

			result = { allowed: true, remaining: bucket.tokens };
		} else {
			result = { allowed: false, remaining: 0 };
		}

		return result;
	}
}

export default MemoryStore;
