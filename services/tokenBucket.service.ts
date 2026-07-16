import {
	getBucket,
	setBucket,
} from "../repositories/memoryStore.repository.js";

const capacity = 100;
const refillRate = 5;

export function check(key: string): { allowed: boolean; remaining: number } {
	const { tokens, lastUpdated } = getBucket(key);
	const elapsedSeconds = Math.floor((Date.now() - lastUpdated) / 1000);
	const newTokenCount = Math.min(
		capacity,
		tokens + refillRate * elapsedSeconds,
	);
	if (newTokenCount >= 1) {
		// Consume Token
		setBucket(key, { tokens: newTokenCount - 1, lastUpdated: Date.now() });

		return { allowed: true, remaining: newTokenCount - 1 };
	} else {
		return { allowed: false, remaining: 0 };
	}
}
