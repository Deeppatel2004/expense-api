
const express = require("express");
const Expense = require("../models/Expense");

const router = express.Router();

// POST /expenses
router.post("/", async (req, res, next) => {
  try {
    const { title, amount, category, date, notes, owner } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    if (
      ![
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Entertainment",
        "Health",
        "Education",
        "Other",
      ].includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (!date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
      });
    }

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Owner is required",
      });
    }

    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      notes,
      owner,
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
