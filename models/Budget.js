
const mongoose = require("mongoose");
const { CATEGORIES } = require("./Expense");

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: CATEGORIES,
    },

    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
    },

    limit: {
      type: Number,
      required: [true, "Limit is required"],
      min: [0.01, "Limit must be greater than 0"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate budgets for the same owner, category and month.
budgetSchema.index(
  { owner: 1, category: 1, month: 1 },
  { unique: true },
);

module.exports = mongoose.model("Budget", budgetSchema);
