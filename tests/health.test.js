import request from "supertest";

const app = require("../server");

describe("GET /health", () => {
  it("should return 200 and API status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Expense API is running");
  });
});
