const {
  validateExpense,
  toPublicExpense,
  expenseFilter,
  totalsByCategory,
  monthlyTotals,
} = require("../helpers");

const validExpense = {
  title: "Lunch",
  amount: 100,
  category: "Food",
  date: "2026-11-18",
  notes: "Lunch with friends",
};

describe("validateExpense", () => {
  it("accepts valid expense data", () => {
    expect(validateExpense(validExpense)).toBe(null);
  });

  it("rejects missing data", () => {
    expect(validateExpense(null)).toBe("Invalid expense data");
  });

  it("rejects array data", () => {
    expect(validateExpense([])).toBe("Invalid expense data");
  });

  it("rejects missing title", () => {
    expect(
      validateExpense({
        ...validExpense,
        title: undefined,
      }),
    ).toBe("Title is required");
  });

  it("rejects empty title", () => {
    expect(
      validateExpense({
        ...validExpense,
        title: "   ",
      }),
    ).toBe("Title is required");
  });

  it("rejects missing amount", () => {
    expect(
      validateExpense({
        ...validExpense,
        amount: undefined,
      }),
    ).toBe("Amount must be at least 0.01");
  });

  it("rejects amount zero", () => {
    expect(
      validateExpense({
        ...validExpense,
        amount: 0,
      }),
    ).toBe("Amount must be at least 0.01");
  });

  it("rejects negative amount", () => {
    expect(
      validateExpense({
        ...validExpense,
        amount: -50,
      }),
    ).toBe("Amount must be at least 0.01");
  });

  it("rejects non-numeric amount", () => {
    expect(
      validateExpense({
        ...validExpense,
        amount: "abc",
      }),
    ).toBe("Amount must be at least 0.01");
  });

  it("rejects invalid category", () => {
    expect(
      validateExpense({
        ...validExpense,
        category: "Travel",
      }),
    ).toBe("Invalid category");
  });

  it("rejects invalid date", () => {
    expect(
      validateExpense({
        ...validExpense,
        date: "not-a-date",
      }),
    ).toBe("Valid date is required");
  });

  it("rejects missing date", () => {
    expect(
      validateExpense({
        ...validExpense,
        date: undefined,
      }),
    ).toBe("Valid date is required");
  });

  it("rejects non-string notes", () => {
    expect(
      validateExpense({
        ...validExpense,
        notes: 123,
      }),
    ).toBe("Notes must be a string");
  });
});

describe("toPublicExpense", () => {
  it("converts an expense and hides owner", () => {
    const expense = {
      _id: "507f1f77bcf86cd799439011",
      title: "Lunch",
      amount: 100,
      category: "Food",
      date: new Date("2026-11-18"),
      notes: "Test",
      owner: "private-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toPublicExpense(expense);

    expect(result.id).toBe("507f1f77bcf86cd799439011");
    expect(result.title).toBe("Lunch");
    expect(result).not.toHaveProperty("owner");
  });
});

describe("expenseFilter", () => {
  it("filters by owner", () => {
    expect(expenseFilter("user123")).toEqual({
      owner: "user123",
    });
  });

  it("filters by category", () => {
    expect(
      expenseFilter("user123", {
        category: "Food",
      }),
    ).toEqual({
      owner: "user123",
      category: "Food",
    });
  });

  it("filters by month", () => {
    const result = expenseFilter("user123", {
      month: "2026-11",
    });

    expect(result.owner).toBe("user123");
    expect(result.date.$gte).toEqual(new Date("2026-11-01T00:00:00.000Z"));
    expect(result.date.$lt).toEqual(new Date("2026-12-01T00:00:00.000Z"));
  });

  it("ignores an invalid month", () => {
    expect(
      expenseFilter("user123", {
        month: "2026-15",
      }),
    ).toEqual({
      owner: "user123",
    });
  });
});

describe("totalsByCategory", () => {
  it("calculates category totals and sorts biggest first", () => {
    const expenses = [
      { category: "Food", amount: 10 },
      { category: "Bills", amount: 30 },
      { category: "Food", amount: 5.5 },
    ];

    expect(totalsByCategory(expenses)).toEqual([
      { category: "Bills", total: 30 },
      { category: "Food", total: 15.5 },
    ]);
  });

  it("returns an empty array for no expenses", () => {
    expect(totalsByCategory([])).toEqual([]);
  });

  it("rounds totals to two decimal places", () => {
    expect(
      totalsByCategory([
        { category: "Food", amount: 1.111 },
        { category: "Food", amount: 2.222 },
      ]),
    ).toEqual([{ category: "Food", total: 3.33 }]);
  });
});

describe("monthlyTotals", () => {
  it("calculates totals for each month", () => {
    const expenses = [
      { date: "2026-11-03", amount: 10.5 },
      { date: "2026-11-20", amount: 4.25 },
      { date: "2026-12-01", amount: 7 },
    ];

    expect(monthlyTotals(expenses)).toEqual({
      "2026-11": 14.75,
      "2026-12": 7,
    });
  });

  it("returns an empty object for no expenses", () => {
    expect(monthlyTotals([])).toEqual({});
  });

  it("ignores invalid dates", () => {
    expect(monthlyTotals([{ date: "invalid-date", amount: 50 }])).toEqual({});
  });
});
