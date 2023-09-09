const admin = require("firebase-admin");
const { DevicesModel } = require("../models/devices");

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
  const latestDeviceTokens = await DevicesModel.aggregate(pipeline);

  return latestDeviceTokens;
}

const BATCH_SIZE = 500;

async function sendNotifications(params) {
  try {
    const notifications = [];
    const deviceTokens = await getLatestDeviceTokens();

    const totalBatches = Math.ceil(deviceTokens.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const batchTokens = deviceTokens
        .slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
        .map((token) => token.deviceId);

      const message = {
        tokens: batchTokens,
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

      const response = await admin.messaging().sendMulticast(message);

      console.log(
        `Batch ${i + 1}/${totalBatches}: ${response.successCount} successful, ${
          response.failureCount
        } failed.`
      );

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            "Failed to send message to token:",
            batchTokens[idx],
            "because of",
            resp.error
          );
        }
      });
    }
    console.log("Notifications sent to all users.");
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}

module.exports = {
  sendNotifications,
};
