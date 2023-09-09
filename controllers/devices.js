const { Devices } = require("../models/devices");
const { sendNotifications } = require("./firebaseAuth");

//list
const getDevicesList = async (req, res) => {
  try {
    const data = await Devices.find({}).limit(10);
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ msg: err });
  }
};

// token-form
const sendNotificationsToAllUsers = async (req, res) => {
  const { title, body } = req.body;

  try {
    await sendNotifications({
      title: title,
      body: body,
    });

    res.json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the notification" });
  }
};

module.exports = {
  getDevicesList,
  sendNotificationsToAllUsers,
};
