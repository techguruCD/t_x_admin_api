const jwt = require('jsonwebtoken');

// Your secret key for JWT token signing
const secretKey = process.env.JWT_SECRET;

// Middleware function to check for authentication
function authMiddleware(req, res, next) {
  // Get the token from the request headers or query parameters
  const token = req.cookies["jwt"];

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: No token provided' });
  }

  // Verify the token
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed: Invalid token' });
    }

    // Attach the decoded user information to the request for future use
    req.admin = decoded;
    next();
  });
}

module.exports = authMiddleware;
