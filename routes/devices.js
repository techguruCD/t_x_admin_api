const express = require("express");
const {
  getDevicesList,
  sendNotificationsToAllUsers,
} = require("../controllers/devices");

const router = express.Router();

//list
router.route("/devices-list").get(getDevicesList);

router.route("/token-form").post(sendNotificationsToAllUsers);

module.exports = router;
