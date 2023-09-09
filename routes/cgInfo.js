const express = require("express");
const { getCGInfoList } = require("../controllers/cgInfo");

const router = express.Router();

//list
router.route("/cgInfo-list").get(getCGInfoList);

module.exports = router;
