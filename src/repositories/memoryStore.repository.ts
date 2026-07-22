import { logger } from "../config/logger.js";
import type {
	Bucket,
	BucketConfig,
	SlidingWindow,
	SlidingWindowConfig,
	Store,
} from "../types.js";

const inMemoryStore: Record<string, Bucket | SlidingWindow> = {};

class MemoryStore implements Store {
	async get(key: string): Promise<Bucket | SlidingWindow | undefined> {
		logger.debug(`Getting key:${key} from inMemoryStore`);
		const value = inMemoryStore[key];
		return value;
	}

	async set(key: string, value: Bucket | SlidingWindow): Promise<void> {
		logger.debug(`Setting key:${key} in inMemoryStore`);
		inMemoryStore[key] = value;
	}

	async del(key: string): Promise<void> {
		delete inMemoryStore[key];
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
			await this.set(key, bucket);

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
			if (inMemoryStore[key]?.type === "SlidingWindow") {
				inMemoryStore[key].timestamps.push(now);
			}
			return true;
		} else {
			return false;
		}
	}
}

export default MemoryStore;
