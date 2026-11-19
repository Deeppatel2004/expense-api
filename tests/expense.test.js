
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
const Expense = require("../models/Expense");
const User = require("../models/User");

const validExpense = {
  title: "Lunch",
  amount: 100,
  category: "Food",
  date: "2026-11-18",
  notes: "Lunch with friends",
};

let token;
let userId;

let tokenB;
let userIdB;

// CREATE TWO TEST USERS
beforeAll(async () => {
  // User A
  const user = await User.create({
    name: "Expense Test User",
    email: "expense-test@example.com",
    password: "test-password",
  });

  userId = user._id.toString();

  token = jwt.sign(
    {
      sub: userId,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // User B
  const userB = await User.create({
    name: "Second Test User",
    email: "expense-test-b@example.com",
    password: "test-password",
  });

  userIdB = userB._id.toString();

  tokenB = jwt.sign(
    {
      sub: userIdB,
      email: userB.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

// CLEAN UP AFTER TESTS
afterAll(async () => {
  await Expense.deleteMany({});

  await User.deleteMany({
    _id: { $in: [userId, userIdB] },
  });
});

describe("Expense API", () => {
  // Clear test expenses before every test
  beforeEach(async () => {
    await Expense.deleteMany({});
  });

  // Helper: attach User A's token
  function auth(req) {
    return req.set("Authorization", `Bearer ${token}`);
  }

  // 1. CREATE
  describe("POST /expenses", () => {
    it("creates an expense with status 201 and hides owner", async () => {
      const response = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.expense.title).toBe("Lunch");
      expect(response.body.expense.amount).toBe(100);
      expect(response.body.expense).not.toHaveProperty("owner");
    });

    it("refuses an empty title with status 400", async () => {
      const response = await auth(
        request(app).post("/expenses")
      ).send({
        ...validExpense,
        title: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Title is required");
    });

    it("refuses amount zero with status 400", async () => {
      const response = await auth(
        request(app).post("/expenses")
      ).send({
        ...validExpense,
        amount: 0,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        "Amount must be at least 0.01"
      );
    });

    it("refuses a bad category with status 400", async () => {
      const response = await auth(
        request(app).post("/expenses")
      ).send({
        ...validExpense,
        category: "Travel",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid category");
    });
  });

  // 2. READ ALL
  describe("GET /expenses", () => {
    it("lists expenses with status 200 and an array", async () => {
      await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const response = await auth(
        request(app).get("/expenses")
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.expenses)).toBe(true);
      expect(response.body.expenses.length).toBe(1);
    });
  });

  // 3. READ ONE
  describe("GET /expenses/:id", () => {
    it("gets one expense with status 200", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const response = await auth(
        request(app).get(`/expenses/${id}`)
      );

      expect(response.status).toBe(200);
      expect(response.body.expense.id).toBe(id);
      expect(response.body.expense.title).toBe("Lunch");
    });

    it("returns 404 for a made-up ID", async () => {
      const response = await auth(
        request(app).get("/expenses/507f1f77bcf86cd799439011")
      );

      expect(response.status).toBe(404);
    });
  });

  // 4. UPDATE
  describe("PATCH /expenses/:id", () => {
    it("updates an expense and really changes its value", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const response = await auth(
        request(app).patch(`/expenses/${id}`)
      ).send({
        title: "Dinner",
        amount: 250,
      });

      expect(response.status).toBe(200);
      expect(response.body.expense.title).toBe("Dinner");
      expect(response.body.expense.amount).toBe(250);
    });
  });

  // 5. DELETE
  describe("DELETE /expenses/:id", () => {
    it("deletes an expense and then GET returns 404", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const deleteResponse = await auth(
        request(app).delete(`/expenses/${id}`)
      );

      expect(deleteResponse.status).toBe(204);

      const getResponse = await auth(
        request(app).get(`/expenses/${id}`)
      );

      expect(getResponse.status).toBe(404);
    });
  });

  // 6. OWNERSHIP PROTECTION
  describe("Expense ownership", () => {
    it("does not allow User B to read User A's expense", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const response = await request(app)
        .get(`/expenses/${id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(response.status).toBe(404);
    });

    it("does not allow User B to update User A's expense", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const response = await request(app)
        .patch(`/expenses/${id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          title: "Changed by User B",
        });

      expect(response.status).toBe(404);

      // Confirm User A's expense is unchanged
      const original = await auth(
        request(app).get(`/expenses/${id}`)
      );

      expect(original.body.expense.title).toBe("Lunch");
    });

    it("does not allow User B to delete User A's expense", async () => {
      const created = await auth(
        request(app).post("/expenses")
      ).send(validExpense);

      const id = created.body.expense.id;

      const response = await request(app)
        .delete(`/expenses/${id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(response.status).toBe(404);

      // Confirm User A's expense still exists
      const original = await auth(
        request(app).get(`/expenses/${id}`)
      );

      expect(original.status).toBe(200);
    });
  });
});
