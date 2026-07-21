export interface Store {
	del(key: string): Promise<void>; // Used For Tests
	checkWithTokenBucket(key: string, config: BucketConfig): Promise<boolean>;
	checkWithSlidingWindow(
		key: string,
		config: SlidingWindowConfig,
	): Promise<boolean>;
}

export type Bucket = {
	type: "Bucket";
	tokens: number;
	lastUpdated: number;
};

export type BucketConfig = {
	capacity: number;
	refillRate: number;
};

export type SlidingWindow = {
	type: "SlidingWindow";
	timestamps: number[];
};

export type SlidingWindowConfig = {
	windowSize: number;
	maxRequests: number;
};

export type Config = {
	algorithm: "tokenBucket" | "slidingWindow";
	tokenBucket: BucketConfig;
	slidingWindow: SlidingWindowConfig;
};
