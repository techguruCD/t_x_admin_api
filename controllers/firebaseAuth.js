const admin = require("firebase-admin");
const { Devices } = require("../models/devices");

const firebaseConfig = {
  client_email: process.env.FB_CLIENT_EMAIL,
  private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
  project_id: process.env.FB_PROJECT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

async function getLatestDeviceTokens() {
  const pipeline = [
    {
      $sort: {
        userId: 1,
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: "$userId",
        deviceId: {
          $last: "$deviceId",
        },
      },
    },
  ];
  const latestDeviceTokens = await Devices.aggregate(pipeline);

  return latestDeviceTokens;
}

async function sendNotifications(params) {
  try {
    const notifications = [];
    const deviceTokens = await getLatestDeviceTokens();

    for (const token of deviceTokens) {
      const registrationToken = token.deviceId;
      console.log(registrationToken);
      if (registrationToken) {
        const message = {
          token: registrationToken,
          data: {
            title: params.title,
            body: params.body,
          },
          notification: {
            title: params.title,
            body: params.body,
          },
          apns: {
            headers: {
              "apns-priority": "5",
            },
          },
          webpush: {
            headers: {
              TTL: "86400",
            },
          },
        };
        console.log(message);
        const response = await admin.messaging().send(message);
        console.log("@@@@", response);
        notifications.push(response);
        console.log("####", notifications);
      } else {
        console.log("Empty registration token found. Skipping notification.");
      }
    }
    console.log("Notifications sent to all users.");
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}

module.exports = {
  sendNotifications,
};
