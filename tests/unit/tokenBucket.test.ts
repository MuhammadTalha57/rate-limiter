import { beforeEach, expect, it, vi } from "vitest";
import { limiter } from "../../src/app.js";
import store from "../../src/repositories/store.repository.js";
import type { Config } from "../../src/types.js";

beforeEach(async () => {
	await store.del("/api");
});

it("should allow request when tokens are available", async () => {
	const overrides: Partial<Config> = {
		algorithm: "tokenBucket",
		tokenBucket: {
			capacity: 100,
			refillRate: 100,
		},
	};
	const result = await limiter.check("/api", overrides);
	expect(result).to.be.true;
});

it("should not allow request when tokens are unavailable", async () => {
	const overrides: Partial<Config> = {
		algorithm: "tokenBucket",
		tokenBucket: {
			capacity: 1,
			refillRate: 1,
		},
	};
	const result1 = await limiter.check("/api", overrides);
	expect(result1).to.be.true;
	const result2 = await limiter.check("/api", overrides);
	expect(result2).to.be.false;
});

it("should refill requests according to refillRate", async () => {
	vi.useFakeTimers({ toFake: ["Date"] });

	const overrides: Partial<Config> = {
		algorithm: "tokenBucket",
		tokenBucket: {
			capacity: 1,
			refillRate: 0.5,
		},
	};

	const result1 = await limiter.check("/api", overrides);
	const result2 = await limiter.check("/api", overrides);

	await vi.advanceTimersByTimeAsync(2000);
	const result3 = await limiter.check("/api", overrides);

	expect(result1).to.be.true;
	expect(result2).to.be.false;
	expect(result3).to.be.true;

	vi.useRealTimers();
});

it("should refill requests till capacity", async () => {
	vi.useFakeTimers({ toFake: ["Date"] });

	const overrides: Partial<Config> = {
		algorithm: "tokenBucket",
		tokenBucket: {
			capacity: 1,
			refillRate: 1,
		},
	};

	const result1 = await limiter.check("/api", overrides);
	const result2 = await limiter.check("/api", overrides);

	await vi.advanceTimersByTimeAsync(5000);
	const result3 = await limiter.check("/api", overrides);
	const result4 = await limiter.check("/api", overrides);

	expect(result1).to.be.true;
	expect(result2).to.be.false;
	expect(result3).to.be.true;
	expect(result4).to.be.false;

	vi.useRealTimers();
});
