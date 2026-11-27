
const express = require("express");
const router = express.Router();

const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const requireAuth = require("../middleware/requireAuth");

const {
  isValidId,
  errorBody,
  statusForDbError,
  totalsByCategory,
  percentUsed,
  budgetStatus,
  remaining,
} = require("../helpers");

// Protect all budget routes
router.use(requireAuth);

// Check month format
function isValidMonth(month) {
  return (
    typeof month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  );
}

// Get UTC date range for a month
function getMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    $gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    $lt: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

// Create public budget response
function toPublicBudget(budget, spent = 0) {
  return {
    id: String(budget._id),
    category: budget.category,
    month: budget.month,
    limit: budget.limit,
    spent,
    percent: percentUsed(spent, budget.limit),
    status: budgetStatus(spent, budget.limit),
    left: remaining(spent, budget.limit),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

// POST /budgets - Create a budget
router.post("/", async (req, res) => {
  try {
    const { category, month, limit } = req.body || {};

    if (!Expense.CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json(errorBody(400, "Invalid category"));
    }

    if (!isValidMonth(month)) {
      return res
        .status(400)
        .json(errorBody(400, "Invalid month format. Use YYYY-MM"));
    }

    if (
      typeof limit !== "number" ||
      !Number.isFinite(limit) ||
      limit <= 0
    ) {
      return res
        .status(400)
        .json(errorBody(400, "Limit must be a number greater than 0"));
    }

    // Check for an existing budget before creating
    const existingBudget = await Budget.findOne({
      owner: req.user.id,
      category,
      month,
    });

    if (existingBudget) {
      return res
        .status(409)
        .json(errorBody(409, "Budget already exists for this category and month"));
    }

    // Calculate spending before creating the budget
    const expenses = await Expense.find({
      owner: req.user.id,
      category,
      date: getMonthRange(month),
    });

    const spent = expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

    const budget = await Budget.create({
      category,
      month,
      limit,
      owner: req.user.id,
    });

    return res.status(201).json({
      success: true,
      budget: toPublicBudget(budget, Number(spent.toFixed(2))),
    });
  } catch (err) {
    const status = statusForDbError(err);

    return res
      .status(status)
      .json(
        errorBody(
          status,
          status === 500 ? "Internal server error" : err.message,
        ),
      );
  }
});

// GET /budgets?month=2026-11 - List monthly budgets
router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    if (!isValidMonth(month)) {
      return res
        .status(400)
        .json(errorBody(400, "Invalid month format. Use YYYY-MM"));
    }

    // Fetch only this user's budgets
    const budgets = await Budget.find({
      owner: req.user.id,
      month,
    });

    // Fetch this user's expenses for the requested month
    const expenses = await Expense.find({
      owner: req.user.id,
      date: getMonthRange(month),
    });

    // Calculate spending totals by category
    const categoryTotals = totalsByCategory(expenses);

    const totalsMap = Object.fromEntries(
      categoryTotals.map((item) => [item.category, item.total]),
    );

    const result = budgets.map((budget) =>
      toPublicBudget(budget, totalsMap[budget.category] || 0),
    );

    return res.status(200).json({
      success: true,
      month,
      count: result.length,
      budgets: result,
    });
  } catch (err) {
    const status = statusForDbError(err);

    return res
      .status(status)
      .json(errorBody(status, "Unable to fetch budgets"));
  }
});

// PATCH /budgets/:id - Update budget limit
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.body || {};

    if (!isValidId(id)) {
      return res.status(404).json(errorBody(404, "Budget not found"));
    }

    if (
      typeof limit !== "number" ||
      !Number.isFinite(limit) ||
      limit <= 0
    ) {
      return res
        .status(400)
        .json(errorBody(400, "Limit must be a number greater than 0"));
    }

    const budget = await Budget.findOneAndUpdate(
      {
        _id: id,
        owner: req.user.id,
      },
      {
        $set: { limit },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!budget) {
      return res.status(404).json(errorBody(404, "Budget not found"));
    }

    const expenses = await Expense.find({
      owner: req.user.id,
      category: budget.category,
      date: getMonthRange(budget.month),
    });

    const spent = expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

    return res.status(200).json({
      success: true,
      budget: toPublicBudget(budget, Number(spent.toFixed(2))),
    });
  } catch (err) {
    const status = statusForDbError(err);

    return res
      .status(status)
      .json(
        errorBody(
          status,
          status === 500 ? "Internal server error" : err.message,
        ),
      );
  }
});

// DELETE /budgets/:id - Delete a budget
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(errorBody(404, "Budget not found"));
    }

    const deletedBudget = await Budget.findOneAndDelete({
      _id: id,
      owner: req.user.id,
    });

    if (!deletedBudget) {
      return res.status(404).json(errorBody(404, "Budget not found"));
    }

    return res.status(204).send();
  } catch (err) {
    const status = statusForDbError(err);

    return res
      .status(status)
      .json(errorBody(status, "Unable to delete budget"));
  }
});

module.exports = router;
