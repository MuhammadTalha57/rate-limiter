import { logger } from "../config/logger.js";
import type { Bucket, Store } from "../types.js";

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
}

export default MemoryStore;
