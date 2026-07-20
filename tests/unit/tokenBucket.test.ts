import { beforeEach, expect, it, vi } from "vitest";
import store from "../../src/repositories/store.repository.js";
import createTokenBucket from "../../src/services/tokenBucket.service.js";

beforeEach(async () => {
	await store.del("/api");
});

it("should allow request when tokens are available", async () => {
	const bucket = createTokenBucket({ capacity: 100, refillRate: 100 }, store);

	expect((await bucket.check("/api")).allowed).to.be.true;
});

it("should not allow request when tokens are unavailable", async () => {
	const bucket = createTokenBucket({ capacity: 1, refillRate: 0 }, store);

	expect((await bucket.check("/api")).allowed).to.be.true;
	expect((await bucket.check("/api")).allowed).to.be.false;
});

it("should refill requests according to refillRate", async () => {
	vi.useFakeTimers({ toFake: ["Date"] });
	const bucket = createTokenBucket({ capacity: 1, refillRate: 1 }, store);

	expect((await bucket.check("/api")).allowed).to.be.true;
	expect((await bucket.check("/api")).allowed).to.be.false;

	// Wait For Refill
	await vi.advanceTimersByTimeAsync(1000);

	expect((await bucket.check("/api")).allowed).to.be.true;

	vi.useRealTimers();
});

it("should refill requests till capacity", async () => {
	vi.useFakeTimers({ toFake: ["Date"] });
	const bucket = createTokenBucket({ capacity: 2, refillRate: 1 }, store);

	expect((await bucket.check("/api")).allowed).to.be.true;
	expect((await bucket.check("/api")).allowed).to.be.true;

	// Wait For Refill [wait for 3s but capped at 2]
	await vi.advanceTimersByTimeAsync(3000);

	expect((await bucket.check("/api")).remaining).to.be.equal(1);

	vi.useRealTimers();
});
