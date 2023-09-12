const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getBQPairList } = require("../controllers/bqPair");

const router = express.Router();

// Get list of BQPair
router.route("/list").get(getBQPairList);

module.exports = router;
