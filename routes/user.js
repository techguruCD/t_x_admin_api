const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getUser, getUserList } = require("../controllers/user");

const router = express.Router();

// Get a specific user
router.route("/").get(authMiddleware, getUser);

// Get list of admins
router.route("/list").get(authMiddleware, getUserList);


module.exports = router;
