import request from "supertest";
import { expect, it } from "vitest";
import app from "../../src/app.js";
import store from "../../src/repositories/store.repository.js";
import type { Config } from "../../src/types.js";

it("should rate limit requests according to tokens left", async () => {
	await store.del("u1");

	const overrides: Partial<Config> = {
		algorithm: "tokenBucket",
		tokenBucket: {
			capacity: 1,
			refillRate: 0,
		},
	};
	const result1 = await request(app).post("/check").send({
		key: "u1",
		overrides,
	});

	const result2 = await request(app).post("/check").send({
		key: "u1",
		overrides,
	});

	expect(result1.body.allowed).toBe(true);
	expect(result2.body.allowed).toBe(false);
});
