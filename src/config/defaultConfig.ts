export const defaultConfig = {
	tokenBucket: {
		capacity: 100,
		refillRate: 10,
	},
	store: process.env.STORE_TYPE || "memory",
};
