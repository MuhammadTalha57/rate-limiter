import { logger } from "../config/logger.js";
import type { BucketConfig, Config, Store } from "../types.js";

export default function createTokenBucket(
	bucketConfig: BucketConfig,
	store: Store,
) {
	return {
		async check(
			key: string,
			overrides: Partial<BucketConfig> = {},
		): Promise<{ allowed: boolean; remaining: number }> {
			logger.info(`[Token Bucket] checking key:${key} ${overrides.refillRate}`);

			const capacity = overrides.capacity ?? bucketConfig.capacity;
			const refillRate = overrides.refillRate ?? bucketConfig.refillRate;

			const config: Config = {
				storeType: process.env.STORE_TYPE ?? "Redis",
				tokenBucket: {
					capacity,
					refillRate,
				},
			};

			const result = await store.check(key, config);

			logger.info(
				`[Token Bucket] Checked key:${key} result:${result.allowed}, ${result.remaining}`,
			);
			return result;
		},
	};
}
