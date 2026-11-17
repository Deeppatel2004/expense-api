
import { describe, it, expect } from "vitest";
import request from "supertest";

const app = require("../server");

describe("POST /expenses", () => {
  it("should return 400 when expense data is invalid", async () => {
    const response = await request(app)
      .post("/expenses")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Title is required");
  });
});
