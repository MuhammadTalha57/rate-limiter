export interface Store {
	get(key: string): { tokens: number; lastUpdated: number } | undefined;
	set(key: string, bucket: { tokens: number; lastUpdated: number }): void;
}

export interface BucketConfig {
	capacity: number;
	refillRate: number;
}
