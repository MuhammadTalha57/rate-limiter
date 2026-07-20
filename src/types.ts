export interface Store {
	get(key: string): Promise<Bucket | undefined>;
	set(key: string, bucket: Bucket): Promise<void>;
	del(key: string): Promise<void>;
}

export type Bucket = {
	tokens: number;
	lastUpdated: number;
};

export type BucketConfig = {
	capacity: number;
	refillRate: number;
};

export type Config = {
	tokenBucket: BucketConfig;
	storeType: string;
};
