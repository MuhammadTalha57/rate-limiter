import { beforeEach, expect, it, vi } from "vitest";
import { limiter } from "../../src/app.js";
import store from "../../src/repositories/store.repository.js";
import type { Config } from "../../src/types.js";

beforeEach(async () => {
	await store.del("/api/v1");
});

it("should allow request when requests are under maxRequests", async () => {
	const overrides: Partial<Config> = {
		algorithm: "slidingWindow",
		slidingWindow: {
			windowSize: 1 * 60 * 1000,
			maxRequests: 100,
		},
	};
	const result = await limiter.check("/api/v1/v1", overrides);
	expect(result).to.be.true;
});

it("should not allow request when requests are not under maxRequests", async () => {
	const overrides: Partial<Config> = {
		algorithm: "slidingWindow",
		slidingWindow: {
			windowSize: 1 * 60 * 1000,
			maxRequests: 1,
		},
	};
	const result1 = await limiter.check("/api/v1", overrides);
	expect(result1).to.be.true;
	const result2 = await limiter.check("/api/v1", overrides);
	expect(result2).to.be.false;
});

it("should discard out of window requests", async () => {
	vi.useFakeTimers({ toFake: ["Date"] });

	const overrides: Partial<Config> = {
		algorithm: "slidingWindow",
		slidingWindow: {
			windowSize: 1 * 60 * 1000,
			maxRequests: 1,
		},
	};

	const result1 = await limiter.check("/api/v1", overrides);
	const result2 = await limiter.check("/api/v1", overrides);

	await vi.advanceTimersByTimeAsync(1 * 60 * 1000);
	const result3 = await limiter.check("/api/v1", overrides);

	expect(result1).to.be.true;
	expect(result2).to.be.false;
	expect(result3).to.be.true;

	vi.useRealTimers();
});
