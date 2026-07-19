import { logger } from "../config/logger.js";

interface Store {
	get(key: string): { tokens: number; lastUpdated: number } | undefined;
	set(key: string, bucket: { tokens: number; lastUpdated: number }): void;
}

interface BucketConfig {
	capacity: number;
	refillRate: number;
}

export default function createTokenBucket(config: BucketConfig, store: Store) {
	return {
		check(key: string): { allowed: boolean; remaining: number } {
			logger.info(`[Token Bucket] checking key:${key}`);
			let result: {allowed: boolean, remaining: number}; 

			let bucket = store.get(key);
			if (!bucket) {
				bucket = { tokens: config.capacity, lastUpdated: Date.now() };
				store.set(key, bucket);
			}

			const elapsedSeconds = Math.floor(
				(Date.now() - bucket.lastUpdated) / 1000,
			);
			const newTokenCount = Math.min(
				config.capacity,
				bucket.tokens + config.refillRate * elapsedSeconds,
			);
			bucket.tokens = newTokenCount;

			if (bucket.tokens >= 1) {
				// Consume
				bucket.tokens--;
				bucket.lastUpdated += elapsedSeconds * 1000;
				store.set(key, bucket);

				
				result = { allowed: true, remaining: bucket.tokens };
			} else {
				result =  { allowed: false, remaining: 0 };
			}

			logger.info(`[Token Bucket] Checked key:${key} result:${result}`);
			return result;
		},
	};
}
