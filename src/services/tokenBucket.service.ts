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

			if (newTokenCount >= 1) {
				// Consume
				bucket.tokens--;
				bucket.lastUpdated += elapsedSeconds * 1000;
				store.set(key, bucket);

				return { allowed: true, remaining: bucket.tokens };
			} else {
				return { allowed: false, remaining: 0 };
			}
		},
	};
}
