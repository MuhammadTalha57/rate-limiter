import { describe, expect, it, beforeEach, vi } from "vitest";
import store, { clear } from "../../src/repositories/memoryStore.repository.js";
import createTokenBucket from "../../src/services/tokenBucket.service.js";


beforeEach(async () => {
	clear();
})

it("should allow request when tokens are available", () => {
	const bucket = createTokenBucket({ capacity: 100, refillRate: 100 }, store);

	expect(bucket.check("/api").allowed).to.be.true;
});

it("should not allow request when tokens are unavailable", () => {
	const bucket = createTokenBucket({ capacity: 1, refillRate: 0 }, store);

	expect(bucket.check("/api").allowed).to.be.true;
	expect(bucket.check("/api").allowed).to.be.false;
});

it("should refill requests according to refillRate", async () => {
	vi.useFakeTimers({toFake: ["Date"]});
	const bucket = createTokenBucket({ capacity: 1, refillRate: 1 }, store);

	expect(bucket.check("/api").allowed).to.be.true;
	expect(bucket.check("/api").allowed).to.be.false;

	// Wait For Refill
	await vi.advanceTimersByTimeAsync(1000);	

	expect(bucket.check("/api").allowed).to.be.true;

	vi.useRealTimers();
});

it("should refill requests till capacity", async () => {
	vi.useFakeTimers({toFake: ["Date"]});
	const bucket = createTokenBucket({ capacity: 2, refillRate: 1 }, store);

	expect(bucket.check("/api").allowed).to.be.true;
	expect(bucket.check("/api").allowed).to.be.true;

	// Wait For Refill [wait for 3s but capped at 2]
	await vi.advanceTimersByTimeAsync(3000);

	expect(bucket.check("/api").remaining).to.be.equal(1);

	vi.useRealTimers();
});


