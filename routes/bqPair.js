const express = require("express");
const { getBQPairList } = require("../controllers/bqPair");

const router = express.Router();

//list
router.route("/bqPair-list").get(getBQPairList);

module.exports = router;
