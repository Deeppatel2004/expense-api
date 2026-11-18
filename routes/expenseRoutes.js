
const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");

const {
  validateExpense,
  toPublicExpense,
  expenseFilter,
  isValidId,
  cleanPatch,
  errorBody,
  statusForDbError,
} = require("../helpers");

// Temporary fake user ID.
// Authentication will be added tomorrow.
const fakeUserId = "507f1f77bcf86cd799439011";

// POST /expenses - Create expense
router.post("/", async (req, res) => {
  try {
    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json(
        errorBody(400, validationError)
      );
    }

    const expense = await Expense.create({
      ...req.body,
      amount: Number(req.body.amount),
      owner: fakeUserId,
    });

    return res.status(201).json({
      success: true,
      expense: toPublicExpense(expense),
    });
  } catch (err) {
    const status = statusForDbError(err);

    return res.status(status).json(
      errorBody(
        status,
        status === 500 ? "Internal server error" : err.message
      )
    );
  }
});

// GET /expenses - Get all expenses
router.get("/", async (req, res) => {
  try {
    const filter = expenseFilter(fakeUserId, req.query);

    const expenses = await Expense.find(filter).sort({
      date: -1,
    });

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

// GET /expenses/:id - Get single expense
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
    }

    const expense = await Expense.findOne({
      _id: id,
      owner: fakeUserId,
    });

    if (!expense) {
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
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
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
    }

    const changes = cleanPatch(req.body);

    if (Object.keys(changes).length === 0) {
      return res.status(400).json(
        errorBody(400, "No valid changes provided")
      );
    }

    const validationError = validateExpense(changes);

    // PATCH may omit required fields that are already in the database.
    // Validate the merged existing + updated data instead.
    const existing = await Expense.findOne({
      _id: id,
      owner: fakeUserId,
    });

    if (!existing) {
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
    }

    const mergedData = {
      title: changes.title ?? existing.title,
      amount: changes.amount ?? existing.amount,
      category: changes.category ?? existing.category,
      date: changes.date ?? existing.date,
      notes: changes.notes ?? existing.notes,
    };

    const finalValidationError = validateExpense(mergedData);

    if (finalValidationError) {
      return res.status(400).json(
        errorBody(400, finalValidationError)
      );
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: id,
        owner: fakeUserId,
      },
      {
        $set: {
          ...changes,
          ...(changes.amount !== undefined
            ? { amount: Number(changes.amount) }
            : {}),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      expense: toPublicExpense(updatedExpense),
    });
  } catch (err) {
    const status = statusForDbError(err);

    return res.status(status).json(
      errorBody(
        status,
        status === 500 ? "Internal server error" : err.message
      )
    );
  }
});

// DELETE /expenses/:id - Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      owner: fakeUserId,
    });

    if (!deletedExpense) {
      return res.status(404).json(
        errorBody(404, "Expense not found")
      );
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
