import { logger } from "../config/logger.js";
import type { BucketConfig, Store } from "../types.js";

export default function createTokenBucket(config: BucketConfig, store: Store) {
	return {
		check(
			key: string,
			overrides: Partial<BucketConfig>,
		): { allowed: boolean; remaining: number } {
			logger.info(`[Token Bucket] checking key:${key}`);
			const capacity = overrides.capacity ?? config.capacity;
			const refillRate = overrides.refillRate ?? config.refillRate;

			let result: { allowed: boolean; remaining: number };

			let bucket = store.get(key);
			if (!bucket) {
				bucket = { tokens: capacity, lastUpdated: Date.now() };
				store.set(key, bucket);
			}

			const elapsedSeconds = Math.floor(
				(Date.now() - bucket.lastUpdated) / 1000,
			);
			const newTokenCount = Math.min(
				capacity,
				bucket.tokens + refillRate * elapsedSeconds,
			);
			bucket.tokens = newTokenCount;

			if (bucket.tokens >= 1) {
				// Consume
				bucket.tokens--;
				bucket.lastUpdated += elapsedSeconds * 1000;
				store.set(key, bucket);

				result = { allowed: true, remaining: bucket.tokens };
			} else {
				result = { allowed: false, remaining: 0 };
			}

			logger.info(`[Token Bucket] Checked key:${key} result:${result}`);
			return result;
		},
	};
}
