const express = require("express");
const { getAdminList, adminSignup, getAdmin } = require("../controllers/admin");
const { adminLogin, adminLogout } = require("../controllers/auth");
const authMiddleware = require("../middlewares/auth.middleware");
const { forgetPassword, resetPassword } = require("../controllers/forget-password");

const router = express.Router();

// Get a specific admin
router.route("/").get(authMiddleware, getAdmin);

// Get list of admins
router.route("/list").get(authMiddleware, getAdminList);

// Admin Signup
router.route("/signup").post(adminSignup);

// Admin Login
router.route("/login").post(adminLogin);

// Admin Logout
router.route("/logout").post(adminLogout);

//forgetpassword
router.route("/forget-password").post(authMiddleware,forgetPassword);

//resetpassword
router.route("/reset-password").get(authMiddleware,resetPassword);

module.exports = router;
