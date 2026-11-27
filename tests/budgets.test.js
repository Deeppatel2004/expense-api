
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const app = require("../server");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const User = require("../models/User");

const validBudget = {
  category: "Food",
  month: "2026-11",
  limit: 5000,
};

let token;
let userId;
let tokenB;
let userIdB;

beforeAll(async () => {
  const user = await User.create({
    name: "Budget Test User",
    email: "budget-test@example.com",
    password: "test-password",
  });

  userId = user._id.toString();

  token = jwt.sign(
    { sub: userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const userB = await User.create({
    name: "Second Budget User",
    email: "budget-test-b@example.com",
    password: "test-password",
  });

  userIdB = userB._id.toString();

  tokenB = jwt.sign(
    { sub: userIdB, email: userB.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  await Budget.init();
});

afterAll(async () => {
  await Budget.deleteMany({});
  await Expense.deleteMany({});

  await User.deleteMany({
    _id: { $in: [userId, userIdB] },
  });
});

beforeEach(async () => {
  await Budget.deleteMany({});
  await Expense.deleteMany({});
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("Budget API", () => {
  // CREATE
  describe("POST /budgets", () => {
    it("creates a budget with status 201", async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send(validBudget);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.budget.category).toBe("Food");
      expect(response.body.budget.month).toBe("2026-11");
      expect(response.body.budget.limit).toBe(5000);
      expect(response.body.budget.spent).toBe(0);
      expect(response.body.budget.percent).toBe(0);
      expect(response.body.budget.status).toBe("ok");
      expect(response.body.budget.left).toBe(5000);
      expect(response.body.budget).not.toHaveProperty("owner");
    });

    it("returns 409 when the same budget already exists and keeps only one", async () => {
      const firstResponse = await auth(
        request(app).post("/budgets"),
      ).send(validBudget);

      expect(firstResponse.status).toBe(201);

      const secondResponse = await auth(
        request(app).post("/budgets"),
      ).send(validBudget);

      expect(secondResponse.status).toBe(409);

      const budgetCount = await Budget.countDocuments({
        owner: userId,
        category: validBudget.category,
        month: validBudget.month,
      });

      expect(budgetCount).toBe(1);
    });

    it("returns 400 for an invalid category", async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send({
        ...validBudget,
        category: "Travel",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid category");
    });

    it("returns 400 for an invalid month", async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send({
        ...validBudget,
        month: "2026-13",
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when the limit is zero", async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send({
        ...validBudget,
        limit: 0,
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when the limit is not a number", async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send({
        ...validBudget,
        limit: "5000",
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 when the limit is "abc"', async () => {
      const response = await auth(
        request(app).post("/budgets"),
      ).send({
        ...validBudget,
        limit: "abc",
      });

      expect(response.status).toBe(400);
    });

    it("enforces the compound unique index in MongoDB", async () => {
      await Budget.create({
        ...validBudget,
        owner: userId,
      });

      await expect(
        Budget.create({
          ...validBudget,
          owner: userId,
        }),
      ).rejects.toMatchObject({ code: 11000 });
    });
  });

  // READ MONTHLY BUDGETS
  describe("GET /budgets", () => {
    it("lists budgets with calculated spending", async () => {
      await Budget.create({
        ...validBudget,
        owner: userId,
      });

      await Expense.create([
        {
          title: "Lunch",
          amount: 1000,
          category: "Food",
          date: new Date("2026-11-18"),
          owner: userId,
        },
        {
          title: "Dinner",
          amount: 1500,
          category: "Food",
          date: new Date("2026-11-20"),
          owner: userId,
        },
      ]);

      const response = await auth(
        request(app).get("/budgets?month=2026-11"),
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);

      const budget = response.body.budgets[0];

      expect(budget.category).toBe("Food");
      expect(budget.limit).toBe(5000);
      expect(budget.spent).toBe(2500);
      expect(budget.percent).toBe(50);
      expect(budget.status).toBe("ok");
      expect(budget.left).toBe(2500);
    });

    it("returns 400 when month is missing", async () => {
      const response = await auth(
        request(app).get("/budgets"),
      );

      expect(response.status).toBe(400);
    });

    it("does not show another user's budgets", async () => {
      await Budget.create({
        ...validBudget,
        owner: userId,
      });

      const response = await request(app)
        .get("/budgets?month=2026-11")
        .set("Authorization", `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.budgets).toHaveLength(0);
    });
  });

  // UPDATE
  describe("PATCH /budgets/:id", () => {
    it("updates the budget limit", async () => {
      const budget = await Budget.create({
        ...validBudget,
        owner: userId,
      });

      const response = await auth(
        request(app).patch(`/budgets/${budget._id}`),
      ).send({ limit: 8000 });

      expect(response.status).toBe(200);
      expect(response.body.budget.limit).toBe(8000);
    });

    it("does not allow another user to update the budget", async () => {
      const budget = await Budget.create({
        ...validBudget,
        owner: userId,
      });

      const response = await request(app)
        .patch(`/budgets/${budget._id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ limit: 9000 });

      expect(response.status).toBe(404);
    });
  });

  // DELETE
  describe("DELETE /budgets/:id", () => {
    it("deletes a budget", async () => {
      const budget = await Budget.create({
        ...validBudget,
        owner: userId,
      });

      const response = await auth(
        request(app).delete(`/budgets/${budget._id}`),
      );

      expect(response.status).toBe(204);

      const found = await Budget.findById(budget._id);
      expect(found).toBeNull();
    });

    it("does not allow another user to delete the budget", async () => {
      const budget = await Budget.create({
        ...validBudget,
        owner: userId,
      });

      const response = await request(app)
        .delete(`/budgets/${budget._id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(response.status).toBe(404);

      const found = await Budget.findById(budget._id);
      expect(found).not.toBeNull();
    });
  });

  // AUTHENTICATION
  describe("Budget authentication", () => {
    it("returns 401 without a token", async () => {
      const response = await request(app).get("/budgets?month=2026-11");

      expect(response.status).toBe(401);
    });
  });
});
