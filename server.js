
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// CORS - allow React frontend
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5174",
  "https://expense-react-delta.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Middleware
app.use(express.json());

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense API is running",
    version: "1.0.0",
  });
});

// Expense routes
const expenseRoutes = require("./routes/expenseRoutes");
app.use("/expenses", expenseRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server only when executed directly
if (require.main === module) {
  console.log(
    "MONGODB_URI exists:",
    Boolean(process.env.MONGODB_URI)
  );

  console.log(
    "JWT_SECRET exists:",
    Boolean(process.env.JWT_SECRET)
  );

  if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI is missing");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("ERROR: JWT_SECRET is missing");
    process.exit(1);
  }

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
    .then(() => {
      console.log("MongoDB connected");

      const PORT = process.env.PORT || 5000;

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
      process.exit(1);
    });
}

module.exports = app;
