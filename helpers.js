const { CATEGORIES } = require("./models/Expense");

// 1. Validate new expense
function validateExpense(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Invalid expense data";
  }

  const { title, amount, category, date } = data;

  if (typeof title !== "string" || !title.trim()) {
    return "Title is required";
  }

  if (
    amount === undefined ||
    amount === null ||
    amount === "" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) < 0.01
  ) {
    return "Amount must be at least 0.01";
  }

  if (!CATEGORIES.includes(category)) {
    return "Invalid category";
  }

  if (!date || Number.isNaN(Date.parse(date))) {
    return "Valid date is required";
  }

  if (data.notes !== undefined && typeof data.notes !== "string") {
    return "Notes must be a string";
  }

  return null;
}

// 2. Convert MongoDB expense to public API format
function toPublicExpense(expense) {
  return {
    id: String(expense._id),
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    notes: expense.notes,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

// 3. Filter expenses by owner, search, category, month and date range
function expenseFilter(userId, query = {}) {
  const filter = {
    owner: userId,
  };

  // Search by expense title (case-insensitive)
  if (query.search && query.search.trim()) {
    filter.title = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  // Filter by category
  if (query.category) {
    filter.category = query.category;
  }

  // Filter by month
  if (query.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) {
    const [year, month] = query.month.split("-").map(Number);

    filter.date = {
      $gte: new Date(Date.UTC(year, month - 1, 1)),
      $lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  // Filter by start and end date
  else if (query.startDate || query.endDate) {
    filter.date = {};

    if (query.startDate) {
      filter.date.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);

      filter.date.$lt = endDate;
    }
  }

  return filter;
}

// 4. Calculate totals by category
function totalsByCategory(expenses) {
  const totals = {};

  for (const expense of expenses) {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  }

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total);
}

// 5. Calculate monthly totals
function monthlyTotals(expenses) {
  const totals = {};

  for (const expense of expenses) {
    const date = new Date(expense.date);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const month = date.toISOString().slice(0, 7);

    totals[month] = (totals[month] || 0) + expense.amount;
  }

  for (const month in totals) {
    totals[month] = Number(totals[month].toFixed(2));
  }

  return totals;
}

function monthTotal(expenses, month) {
  let total = 0;

  for (const expense of expenses) {
    const date = new Date(expense.date);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const expenseMonth = date.toISOString().slice(0, 7);

    if (expenseMonth === month) {
      total += Number(expense.amount);
    }
  }

  return Number(total.toFixed(2));
}

// 6. Check MongoDB ObjectId
// Reused from todo-api
function isValidId(id) {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

// 7. Prepare allowed PATCH changes
// Adapted from todo-api for Expense fields
function cleanPatch(body) {
  const changes = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return changes;
  }

  const allowedFields = ["title", "amount", "category", "date", "notes"];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      changes[field] = body[field];
    }
  }

  if (typeof changes.title === "string") {
    changes.title = changes.title.trim();
  }

  if (typeof changes.notes === "string") {
    changes.notes = changes.notes.trim();
  }

  return changes;
}

// 8. Standard error response
// Reused from todo-api
function errorBody(status, message = "server error") {
  return {
    error: {
      status,
      message,
    },
  };
}

// 9. Convert database errors into HTTP status codes
// Reused from todo-api
function statusForDbError(err) {
  if (err.code === 11000) return 409;
  if (err.name === "ValidationError") return 400;
  if (err.name === "CastError") return 404;

  return 500;
}

// 10. Calculate budget percentage used
function percentUsed(spent, limit) {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  if (!Number.isFinite(spent)) spent = 0;

  return Math.round((spent / limit) * 100);
}

// 11. Determine budget status
function budgetStatus(spent, limit) {
  if (!Number.isFinite(limit) || limit <= 0) return "none";
  if (!Number.isFinite(spent)) spent = 0;

  const ratio = spent / limit;

  if (ratio >= 1) return "over";
  if (ratio >= 0.75) return "warning";

  return "ok";
}

// 12. Calculate remaining budget
function remaining(spent, limit) {
  if (!Number.isFinite(limit)) return 0;
  if (!Number.isFinite(spent)) spent = 0;

  return Number((limit - spent).toFixed(2));
}

// Export all functions
module.exports = {
  validateExpense,
  toPublicExpense,
  expenseFilter,
  totalsByCategory,
  monthlyTotals,
  monthTotal,
  isValidId,
  cleanPatch,
  errorBody,
  statusForDbError,
  percentUsed,
  budgetStatus,
  remaining,
};
