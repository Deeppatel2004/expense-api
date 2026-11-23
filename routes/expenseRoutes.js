
const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const requireAuth = require("../middleware/requireAuth");

const {
  validateExpense,
  toPublicExpense,
  expenseFilter,
  isValidId,
  cleanPatch,
  errorBody,
  statusForDbError,
  monthTotal,
  totalsByCategory,
} = require("../helpers");

// Protect all expense routes
router.use(requireAuth);

// POST /expenses - Create expense
router.post("/", async (req, res) => {
  try {
    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json(errorBody(400, validationError));
    }

    const expense = await Expense.create({
      ...req.body,
      owner: req.user.id,
    });

    return res.status(201).json({
      success: true,
      expense: toPublicExpense(expense),
    });
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, status === 500 ? "Internal server error" : err.message)
    );
  }
});

// GET /expenses - Get all expenses
router.get("/", async (req, res) => {
  try {
    const filter = expenseFilter(req.user.id, req.query);
    const expenses = await Expense.find(filter);

    return res.status(200).json({
      success: true,
      count: expenses.length,
      expenses: expenses.map(toPublicExpense),
    });
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, "Unable to fetch expenses")
    );
  }
});

// GET /expenses/summary?month=2026-11
// Keep this BEFORE /:id
router.get("/summary", async (req, res) => {
  try {
    const { month } = req.query;

    if (
      typeof month !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json(
        errorBody(400, "Invalid month format. Use YYYY-MM")
      );
    }

    // Convert YYYY-MM into a date range
    const [year, monthNumber] = month.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 1));

    // Fetch only this user's expenses in this month
    const expenses = await Expense.find({
      owner: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Calculate monthly total and category totals
    const total = monthTotal(expenses, month);
    const byCategory = totalsByCategory(expenses);

    // Find the biggest single expense
    const biggestExpense = expenses.reduce((biggest, expense) => {
      if (!biggest || Number(expense.amount) > Number(biggest.amount)) {
        return expense;
      }

      return biggest;
    }, null);

    return res.status(200).json({
      month,
      total,
      byCategory,
      biggestExpense: biggestExpense
        ? {
            title: biggestExpense.title,
            amount: biggestExpense.amount,
          }
        : null,
    });
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, "Unable to fetch summary")
    );
  }
});

// GET /expenses/:id - Get single expense
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    const expense = await Expense.findOne({
      _id: id,
      owner: req.user.id,
    });

    if (!expense) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    return res.status(200).json({
      success: true,
      expense: toPublicExpense(expense),
    });
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, "Unable to fetch expense")
    );
  }
});

// PATCH /expenses/:id - Update expense
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    const changes = cleanPatch(req.body);

    if (Object.keys(changes).length === 0) {
      return res.status(400).json(
        errorBody(400, "No valid changes provided")
      );
    }

    // Find only this user's expense
    const existing = await Expense.findOne({
      _id: id,
      owner: req.user.id,
    });

    if (!existing) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    // Validate the merged existing + updated data
    const mergedData = {
      title: changes.title ?? existing.title,
      amount: changes.amount ?? existing.amount,
      category: changes.category ?? existing.category,
      date: changes.date ?? existing.date,
      notes: changes.notes ?? existing.notes,
    };

    const validationError = validateExpense(mergedData);

    if (validationError) {
      return res.status(400).json(errorBody(400, validationError));
    }

    // Ensure amount is stored as a number
    if (changes.amount !== undefined) {
      changes.amount = Number(changes.amount);
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: id,
        owner: req.user.id,
      },
      {
        $set: changes,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedExpense) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    return res.status(200).json({
      success: true,
      expense: toPublicExpense(updatedExpense),
    });
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, status === 500 ? "Internal server error" : err.message)
    );
  }
});

// DELETE /expenses/:id - Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      owner: req.user.id,
    });

    if (!deletedExpense) {
      return res.status(404).json(errorBody(404, "Expense not found"));
    }

    return res.status(204).send();
  } catch (err) {
    const status = statusForDbError(err);
    return res.status(status).json(
      errorBody(status, "Unable to delete expense")
    );
  }
});

module.exports = router;
