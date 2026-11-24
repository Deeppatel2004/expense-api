const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  // 1. Check Authorization header
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Not logged in",
    });
  }

  // 2. Extract token
  const token = header.split(" ")[1];

  try {
    // 3. Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Store user information
    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

module.exports = requireAuth;
