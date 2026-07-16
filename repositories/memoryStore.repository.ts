const store: Record<string, { tokens: number; lastUpdated: number }> = {};

export function getBucket(key: string): {
	tokens: number;
	lastUpdated: number;
} {
	let bucket = store[key];
	if (!bucket) {
		store[key] = { tokens: 100, lastUpdated: Date.now() };
		bucket = store[key];
	}
	return bucket;
}

export function setBucket(
	key: string,
	bucket: { tokens: number; lastUpdated: number },
): void {
	store[key] = bucket;
}
