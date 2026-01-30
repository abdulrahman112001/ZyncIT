/**
 * Firebase Cloud Functions for iRopit
 * Handles push notifications via FCM
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function: Process push notification requests
 * Triggered when a new document is created in push_notifications collection
 */
exports.sendPushNotification = functions.firestore
  .document("push_notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const notificationId = context.params.notificationId;

    // Skip if already processed
    if (notification.status !== "pending") {
      console.log(`Notification ${notificationId} already processed`);
      return null;
    }

    const fcmToken = notification.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token for notification ${notificationId}`);
      await snap.ref.update({ status: "failed", error: "No FCM token" });
      return null;
    }

    // Build the FCM message
    const message = {
      token: fcmToken,
      notification: {
        title: notification.notification?.title || "New Message",
        body: notification.notification?.body || "",
      },
      data: {
        type: notification.data?.type || "chat",
        senderId: notification.data?.senderId || "",
        senderDeviceId: notification.data?.senderDeviceId || "",
        timestamp: notification.data?.timestamp || Date.now().toString(),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "chat_notifications",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.notification?.title || "New Message",
              body: notification.notification?.body || "",
            },
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    try {
      // Send the FCM message
      const response = await messaging.send(message);
      console.log(
        `Successfully sent notification ${notificationId}:`,
        response,
      );

      // Update status to delivered
      await snap.ref.update({
        status: "delivered",
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmResponse: response,
      });

      return { success: true, messageId: response };
    } catch (error) {
      console.error(`Error sending notification ${notificationId}:`, error);

      // Handle invalid token
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        // Remove invalid FCM token from device
        try {
          const devicesRef = db.collection("devices");
          const deviceQuery = await devicesRef
            .where("fcmToken", "==", fcmToken)
            .get();

          deviceQuery.forEach(async (doc) => {
            await doc.ref.update({
              fcmToken: admin.firestore.FieldValue.delete(),
            });
            console.log(`Removed invalid FCM token from device ${doc.id}`);
          });
        } catch (cleanupError) {
          console.error("Error cleaning up invalid token:", cleanupError);
        }
      }

      // Update notification status to failed
      await snap.ref.update({
        status: "failed",
        error: error.message,
        errorCode: error.code,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: false, error: error.message };
    }
  });

/**
 * Cloud Function: Clean up old notifications
 * Runs daily at midnight
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    try {
      const oldNotifications = await db
        .collection("push_notifications")
        .where("createdAt", "<", oneDayAgo)
        .get();

      const batch = db.batch();
      let count = 0;

      oldNotifications.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Cleaned up ${count} old notifications`);
      }

      return { cleaned: count };
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
      return { error: error.message };
    }
  });

/**
 * Cloud Function: Listen for new chat messages and send notifications
 * Alternative approach - trigger directly from chats collection
 */
exports.onNewChatMessage = functions.firestore
  .document("chats/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;

    // Only send notification for messages from chrome-extension
    if (message.senderPlatform !== "chrome-extension") {
      return null;
    }

    const userId = message.senderId;
    const senderName = message.senderName || "Chrome Extension";
    const content = message.content || "";

    // Get all mobile devices for this user
    try {
      const devicesSnapshot = await db
        .collection("devices")
        .where("userId", "==", userId)
        .get();

      const sendPromises = [];

      devicesSnapshot.forEach((doc) => {
        const device = doc.data();

        // Skip the sender device and devices without FCM token
        if (
          device.id === message.senderDeviceId ||
          !device.fcmToken ||
          device.platform === "chrome" ||
          device.platform === "chrome-extension"
        ) {
          return;
        }

        // Truncate message
        const truncatedContent =
          content.length > 100 ? content.substring(0, 100) + "..." : content;

        const fcmMessage = {
          token: device.fcmToken,
          notification: {
            title: `💬 ${senderName}`,
            body: truncatedContent,
          },
          data: {
            type: "chat",
            messageId: messageId,
            senderId: userId,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "chat_notifications",
              priority: "high",
              defaultSound: true,
            },
          },
        };

        sendPromises.push(
          messaging.send(fcmMessage).catch((error) => {
            console.error(
              `Failed to send to device ${device.id}:`,
              error.message,
            );
          }),
        );
      });

      await Promise.all(sendPromises);
      console.log(`Chat notification sent for message ${messageId}`);

      return { success: true };
    } catch (error) {
      console.error("Error sending chat notifications:", error);
      return { error: error.message };
    }
  });
