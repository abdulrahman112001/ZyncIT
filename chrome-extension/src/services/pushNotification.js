/**
 * Push Notification Service
 * Sends push notifications to mobile devices via Firebase Cloud Messaging
 */

import {
  db,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "../config/firebase.js";

import * as state from "../state/index.js";
import { getDeviceId } from "../utils/helpers.js";

/**
 * Send a push notification to all user's mobile devices
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.type - Notification type (chat, sms, etc.)
 * @param {Object} options.data - Additional data to include
 */
export async function sendPushNotification({
  title,
  body,
  type = "chat",
  data = {},
}) {
  const user = state.currentUser;
  if (!user) {
    console.log("[PushNotification] No user logged in");
    return;
  }

  try {
    const extensionDeviceId = await getDeviceId();

    // Get all user's mobile devices with FCM tokens
    const devicesQuery = query(
      collection(db, "devices"),
      where("userId", "==", user.uid),
    );

    const devicesSnapshot = await getDocs(devicesQuery);
    const mobileDevices = [];

    devicesSnapshot.forEach((doc) => {
      const device = doc.data();
      // Only target mobile devices (not this extension) that have FCM tokens
      if (
        device.id !== extensionDeviceId &&
        device.fcmToken &&
        (device.platform === "android" ||
          device.platform === "Android" ||
          device.platform === "ios")
      ) {
        mobileDevices.push({
          id: device.id,
          fcmToken: device.fcmToken,
          name:
            device.nickname || device.name || device.model || "Mobile Device",
        });
      }
    });

    if (mobileDevices.length === 0) {
      console.log("[PushNotification] No mobile devices with FCM tokens found");
      return;
    }

    console.log(
      `[PushNotification] Sending to ${mobileDevices.length} device(s)`,
    );

    // Create push notification requests in Firestore
    // These will be processed by a Cloud Function or the app directly
    for (const device of mobileDevices) {
      await addDoc(collection(db, "push_notifications"), {
        userId: user.uid,
        deviceId: device.id,
        fcmToken: device.fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: type,
          senderId: user.uid,
          senderDeviceId: extensionDeviceId,
          timestamp: Date.now().toString(),
          ...data,
        },
        status: "pending",
        createdAt: Date.now(),
      });
    }

    console.log("[PushNotification] Notification requests created");
  } catch (error) {
    console.error("[PushNotification] Error sending notification:", error);
  }
}

/**
 * Send a chat message notification
 * @param {string} messageContent - The message content
 * @param {string} senderName - Name of the sender
 */
export async function sendChatNotification(
  messageContent,
  senderName = "Chrome Extension",
) {
  // Truncate message if too long
  const truncatedBody =
    messageContent.length > 100
      ? messageContent.substring(0, 100) + "..."
      : messageContent;

  await sendPushNotification({
    title: `💬 ${senderName}`,
    body: truncatedBody,
    type: "chat",
    data: {
      messagePreview: truncatedBody,
    },
  });
}
