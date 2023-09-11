const { sendNotifications } = require("./firebaseAuth");

// token-form
const sendNotificationsToAllUsers = (req, res) => {
  const { title, body, imageUrl } = req.body;

  try {
    sendNotifications({
      title: title,
      body: body,
      imageUrl: imageUrl,
    });

  } catch (error) {
    console.log("[error sendNotificationsToAllUsers]: ", error)
  }

  return res.status(200).json({ message: "OK" });
};

module.exports = {
  sendNotificationsToAllUsers,
};
