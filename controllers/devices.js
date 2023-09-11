const { DevicesModel } = require("../models/devices");
const { sendNotifications } = require("./firebaseAuth");

// token-form
const sendNotificationsToAllUsers = async (req, res) => {
  const { title, body } = req.body;

  try {
    sendNotifications({
      title: title,
      body: body,
    });

  } catch (error) {
    console.log("[error sendNotificationsToAllUsers]: ", error)
  }

  return res.status(200).json({ message: "OK" });
};

module.exports = {
  sendNotificationsToAllUsers,
};
