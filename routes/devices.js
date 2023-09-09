const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { sendNotificationsToAllUsers } = require("../controllers/devices");

const router = express.Router();

// Token Form
router.route("/token-form").post(sendNotificationsToAllUsers);

module.exports = router;
