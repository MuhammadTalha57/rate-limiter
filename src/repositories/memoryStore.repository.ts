import { logger } from "../config/logger.js";

let inMemoryStore: Record<string, { tokens: number; lastUpdated: number }> =
	{};

export function get(key: string): {
	tokens: number;
	lastUpdated: number;
} | undefined {
	logger.debug(`Getting key:${key} from inMemoryStore`);
	const bucket = inMemoryStore[key];
	return bucket;
}

export function set(
	key: string,
	bucket: { tokens: number; lastUpdated: number },
): void {
	logger.debug(`Setting key:${key} in inMemoryStore`);
	inMemoryStore[key] = bucket;
}

export function clear() {
	inMemoryStore = {};
}

const store = { get, set };
export default store;
