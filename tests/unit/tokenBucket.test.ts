import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../src/app.js";

describe("GET /", () => {
  it("returns hello", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Hello",
    });
  });
});