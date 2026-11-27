
import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const app = require("../server");

const token = jwt.sign(
  {
    sub: "507f1f77bcf86cd799439011",
    email: "category-test@example.com",
  },
  process.env.JWT_SECRET,
  { expiresIn: "1h" },
);

describe("GET /expenses/categories", () => {
  it("should return all available expense categories", async () => {
    const response = await request(app)
      .get("/expenses/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      categories: [
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Entertainment",
        "Health",
        "Education",
        "Other",
      ],
    });
  });
});
