export interface Store {
	get(key: string): Promise<Bucket | SlidingWindow | undefined>;
	set(key: string, bucket: Bucket): Promise<void>;
	del(key: string): Promise<void>;
	check(
		key: string,
		config: Config,
	): Promise<{ allowed: boolean; remaining: number }>;
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
	windowSize: number; // In ms
	maxRequests: number;
};

export type Config = {
	algorithm: "tokenBucket" | "slidingWindow";
	tokenBucket: BucketConfig;
	slidingWindow: SlidingWindowConfig;
};
