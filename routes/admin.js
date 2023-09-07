const express = require("express");
const { getAdminList, adminSignup } = require("../controllers/admin");
const { getAdmin, adminLogin, adminLogout } = require("../controllers/auth");

const router = express.Router();

// Get a specific admin
router.route("/").get(getAdmin);

// Get list of admins
router.route("/list").get(getAdminList);

// Admin Signup
router.route("/signup").post(adminSignup);

// Admin Login
router.route("/login").post(adminLogin);

// Admin Logout
router.route("/logout").post(adminLogout);

module.exports = router;
