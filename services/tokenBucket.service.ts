import { CAPACITY, REFILL_RATE } from "../config/tokenBucket.config.js";
import {
	getBucket,
	setBucket,
} from "../repositories/memoryStore.repository.js";


export function check(key: string): { allowed: boolean; remaining: number } {
	const { tokens, lastUpdated } = getBucket(key);
	const elapsedSeconds = Math.floor((Date.now() - lastUpdated) / 1000);
	const newTokenCount = Math.min(
		CAPACITY,
		tokens + REFILL_RATE * elapsedSeconds,
	);
	if (newTokenCount >= 1) {
		// Consume Token
		setBucket(key, { tokens: newTokenCount - 1, lastUpdated: Date.now() });

		return { allowed: true, remaining: newTokenCount - 1 };
	} else {
		return { allowed: false, remaining: 0 };
	}
}
