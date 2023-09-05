const express = require("express");
const { getUserList, userSignup } = require("../controllers/user");
const { userLogin, getUser, userLogout } = require("../controllers/auth");
const {
  forgetPassword,
  resetPassword,
} = require("../controllers/forget-password");

const router = express.Router();

//list
router.route("/user-list").get(getUserList);

//signup
router.route("/user-signup").post(userSignup);

//login
router.route("/user-login").post(userLogin);
router.route("/user").get(getUser);

//logout
router.route("/user-logout").post(userLogout);

//forgetpassword
router.route("/forget-password").post(forgetPassword);

//resetpassword
router.route("/reset-password").get(resetPassword);

module.exports = router;
