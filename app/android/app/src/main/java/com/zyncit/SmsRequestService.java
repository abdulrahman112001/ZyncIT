package com.zyncit;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.telephony.SmsManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.Query;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class SmsRequestService extends Service {
    private static final String TAG = "SmsRequestService";
    private static final String CHANNEL_ID = "sms_request_channel";
    private static final int NOTIFICATION_ID = 2001;

    private FirebaseFirestore db;
    private ListenerRegistration smsRequestListener;
    private String userId;
    private String deviceId;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SmsRequestService created");
        db = FirebaseFirestore.getInstance();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "SmsRequestService started");

        // MUST call startForeground() before anything else (Android 8+ requirement)
        startForeground(NOTIFICATION_ID, createNotification());

        // Get credentials from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("ZyncITPrefs", MODE_PRIVATE);
        userId = prefs.getString("userId", null);
        deviceId = prefs.getString("deviceId", null);

        if (userId == null || deviceId == null) {
            Log.e(TAG, "No credentials found, stopping service");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Start listening for SMS requests
        startListening();

        return START_STICKY;
    }

    private void startListening() {
        if (smsRequestListener != null) {
            Log.d(TAG, "Listener already active");
            return;
        }

        Log.d(TAG, "Starting SMS request listener for device: " + deviceId);

        smsRequestListener = db.collection("sms_requests")
            .whereEqualTo("toDeviceId", deviceId)
            .whereEqualTo("status", "pending")
            .addSnapshotListener((snapshots, error) -> {
                if (error != null) {
                    Log.e(TAG, "Listen failed: " + error);
                    return;
                }

                if (snapshots == null) return;

                for (DocumentChange dc : snapshots.getDocumentChanges()) {
                    if (dc.getType() == DocumentChange.Type.ADDED) {
                        Map<String, Object> data = dc.getDocument().getData();
                        String phoneNumber = (String) data.get("phoneNumber");
                        String message = (String) data.get("message");
                        String docId = dc.getDocument().getId();

                        Log.d(TAG, "New SMS request: " + phoneNumber + " - " + message);

                        // Send SMS
                        sendSms(phoneNumber, message, docId);
                    }
                }
            });
    }

    private void sendSms(String phoneNumber, String message, String docId) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            ArrayList<String> parts = smsManager.divideMessage(message);
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);

            Log.d(TAG, "SMS sent to: " + phoneNumber);

            // Update status to sent
            db.collection("sms_requests").document(docId)
                .update("status", "sent")
                .addOnSuccessListener(aVoid -> Log.d(TAG, "Request status updated to sent"))
                .addOnFailureListener(e -> Log.e(TAG, "Failed to update status: " + e));

            // Save sent message to notifications collection
            saveSentMessage(phoneNumber, message);

        } catch (Exception e) {
            Log.e(TAG, "Failed to send SMS: " + e.getMessage());

            // Update status to failed
            db.collection("sms_requests").document(docId)
                .update("status", "failed")
                .addOnFailureListener(err -> Log.e(TAG, "Failed to update status: " + err));
        }
    }

    private void saveSentMessage(String phoneNumber, String message) {
        // Create a unique docId based on timestamp and phone number to avoid duplicates
        long timestamp = System.currentTimeMillis();
        String sanitizedPhone = phoneNumber.replaceAll("[^0-9+]", "");
        String docId = "sms_sent_" + timestamp + "_" + sanitizedPhone;
        
        // Get device name from SharedPreferences or use default
        SharedPreferences prefs = getSharedPreferences("ZyncITPrefs", MODE_PRIVATE);
        String deviceName = prefs.getString("deviceName", "Android Device");
        
        Map<String, Object> sentMessage = new HashMap<>();
        sentMessage.put("type", "sms");
        sentMessage.put("phoneNumber", phoneNumber);
        sentMessage.put("contactName", phoneNumber);
        sentMessage.put("body", message);
        sentMessage.put("timestamp", timestamp);
        sentMessage.put("read", true);
        sentMessage.put("direction", "outgoing");
        sentMessage.put("deviceId", deviceId);
        sentMessage.put("deviceName", deviceName);

        db.collection("users")
            .document(userId)
            .collection("devices")
            .document(deviceId)
            .collection("notifications")
            .document(docId)
            .set(sentMessage)
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Sent message saved with docId: " + docId))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to save sent message: " + e));
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SMS Request Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Listens for SMS requests from other devices");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ZyncIT")
            .setContentText("Syncing SMS in background")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "SmsRequestService destroyed");

        if (smsRequestListener != null) {
            smsRequestListener.remove();
            smsRequestListener = null;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
