import request from "supertest";
import { expect, it } from "vitest";
import app from "../../src/app.js";
import store from "../../src/repositories/store.repository.js";

it("should rate limit requests according to tokens left", async () => {
	await store.del("u1");

	const res1 = await request(app)
		.post("/check")
		.send({
			key: "u1",
			config: { tokenBucket: { capacity: 1, refillRate: 0 } },
		});
	const res2 = await request(app)
		.post("/check")
		.send({
			key: "u1",
			config: { tokenBucket: { capacity: 1, refillRate: 0 } },
		});

	expect(res1.body.allowed).toBe(true);
	expect(res2.body.allowed).toBe(false);
});
