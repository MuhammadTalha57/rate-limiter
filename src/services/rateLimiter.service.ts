import type { Config, Store } from "../types.js";

export default function createRateLimiter(store: Store, defaultConfig: Config) {
	return {
		async check(
			key: string,
			overrides: Partial<Config> = {},
		): Promise<boolean> {
			const algorithm = overrides.algorithm ?? defaultConfig.algorithm;

			if (algorithm === "tokenBucket") {
				const capacity =
					overrides.tokenBucket?.capacity ?? defaultConfig.tokenBucket.capacity;
				const refillRate =
					overrides.tokenBucket?.refillRate ??
					defaultConfig.tokenBucket.refillRate;

				return await store.checkWithTokenBucket(key, {
					capacity,
					refillRate,
				});
			} else {
				const windowSize =
					overrides.slidingWindow?.windowSize ??
					defaultConfig.slidingWindow.windowSize;
				const maxRequests =
					overrides.slidingWindow?.maxRequests ??
					defaultConfig.slidingWindow.maxRequests;

				return await store.checkWithSlidingWindow(key, {
					windowSize,
					maxRequests,
				});
			}
		},
	};
}
