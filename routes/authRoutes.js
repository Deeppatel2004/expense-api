
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// 1. Normalize email
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// 2. Validate registration
function validateRegister(body) {
  if (
    typeof body.name !== "string" ||
    body.name.trim() === ""
  ) {
    return { ok: false, error: "Name is required" };
  }

  if (typeof body.email !== "string") {
    return { ok: false, error: "Invalid email" };
  }

  const parts = body.email.trim().split("@");

  if (
    parts.length !== 2 ||
    parts[0] === "" ||
    parts[1] === ""
  ) {
    return { ok: false, error: "Invalid email" };
  }

  if (
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    return {
      ok: false,
      error: "Password must be at least 8 characters"
    };
  }

  return { ok: true };
}

// 3. Public user response
function meResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
}

// 4. POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const body = req.body || {};
    const validation = validateRegister(body);

    if (!validation.ok) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const name = body.name.trim();
    const email = normalizeEmail(body.email);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      body.password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json(meResponse(user));

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// 5. POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const body = req.body || {};

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const password = body.password;

    const user = await User.findOne({ email });

    if (
      !user ||
      typeof password !== "string" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.status(200).json({
      token,
      user: meResponse(user)
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// 6. GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id name email");

    if (!user) {
      return res.status(401).json({
        error: "User no longer exists"
      });
    }

    return res.status(200).json(meResponse(user));

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;
