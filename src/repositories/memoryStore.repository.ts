import { logger } from "../config/logger.js";
import type {
	Bucket,
	BucketConfig,
	Config,
	SlidingWindow,
	SlidingWindowConfig,
	Store,
} from "../types.js";

const inMemoryStore: Record<string, Bucket | SlidingWindow> = {};

class MemoryStore implements Store {
	async get(key: string) {
		logger.debug(`Getting key:${key} from inMemoryStore`);
		const bucket = inMemoryStore[key];
		return bucket;
	}

	async set(key: string, value: Bucket | SlidingWindow) {
		logger.debug(`Setting key:${key} in inMemoryStore`);
		inMemoryStore[key] = value;
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

		if (bucket?.type !== "Bucket") {
			bucket = { type: "Bucket", tokens: capacity, lastUpdated: Date.now() };
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
	async checkWithTokenBucket(
		key: string,
		config: BucketConfig,
	): Promise<boolean> {
		let result: { allowed: boolean; remaining: number };

		const capacity = config.capacity;
		const refillRate = config.refillRate;
		let bucket = await this.get(key);

		if (bucket?.type !== "Bucket") {
			bucket = { type: "Bucket", tokens: capacity, lastUpdated: Date.now() };
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

		return result.allowed;
	}
	async checkWithSlidingWindow(key: string, config: SlidingWindowConfig) {
		const windowSize = config.windowSize;
		const maxRequests = config.maxRequests;

		let window = await this.get(key);

		if (window?.type !== "SlidingWindow") {
			window = { type: "SlidingWindow", timestamps: [] };
			await this.set(key, window);
		}

		const now = Date.now();
		const start = now - windowSize; // Exclusive Left

		window.timestamps = window.timestamps.filter((ts) => ts > start);

		if (window.timestamps.length < maxRequests) {
			window.timestamps.push(now);
			return true;
		} else {
			return false;
		}
	}
}

export default MemoryStore;
