const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getCGInfoList } = require("../controllers/cgInfo");

const router = express.Router();

// Get list of CGInfo
router.route("/list").get(getCGInfoList);

module.exports = router;
