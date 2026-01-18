package com.IRopit;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.bridge.ReactContext;
import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class NotificationService extends NotificationListenerService {
    private static final String TAG = "ZyncIT_NotifService";
    private static final String CHANNEL_ID = "zyncit_foreground_channel";
    private static final int FOREGROUND_NOTIFICATION_ID = 1001;
    
    private static NotificationService instance;
    private Handler mainHandler;
    private FirebaseHelper firebaseHelper;

    // Cache for app icons (Base64)
    private Map<String, String> iconCache = new ConcurrentHashMap<>();

    // Track processed notifications to avoid duplicates
    private Set<String> processedKeys = new HashSet<>();
    private Map<String, Long> lastNotificationTime = new HashMap<>();
    
    // Track notification content to avoid duplicate content (for apps like Gmail)
    private Map<String, String> lastNotificationContent = new ConcurrentHashMap<>();

    // Minimum time between same-key notifications (ms)
    private static final long DUPLICATE_THRESHOLD_MS = 2000;
    
    // Longer threshold for apps that repeatedly send unread notifications (Gmail, etc.)
    private static final long CONTENT_DUPLICATE_THRESHOLD_MS = 300000; // 5 minutes

    // Track service start time to ignore old notifications
    private long serviceStartTime;

    // Package names for SMS apps
    private static final String[] SMS_PACKAGES = {
        "com.google.android.apps.messaging",
        "com.samsung.android.messaging",
        "com.android.mms",
        "com.xiaomi.mms",
        "com.miui.sms",
        "com.huawei.message",
        "com.oneplus.mms",
        "com.sonyericsson.conversations"
    };

    // Package names for Phone/Dialer apps
    private static final String[] PHONE_PACKAGES = {
        "com.google.android.dialer",
        "com.samsung.android.dialer",
        "com.samsung.android.incallui",
        "com.android.dialer",
        "com.android.phone",
        "com.xiaomi.dialer",
        "com.miui.phone",
        "com.huawei.contacts",
        "com.oneplus.dialer",
        "com.sonyericsson.phone"
    };

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        mainHandler = new Handler(Looper.getMainLooper());
        serviceStartTime = System.currentTimeMillis();
        firebaseHelper = FirebaseHelper.getInstance(this);
        Log.i(TAG, "=== NotificationService CREATED ===");
        
        // Start as foreground service to prevent MIUI from killing it
        startForegroundServiceWithNotification();
    }

    /**
     * Start the service as a foreground service with a persistent notification.
     * This prevents aggressive battery optimization (especially on MIUI) from killing the service.
     */
    private void startForegroundServiceWithNotification() {
        try {
            createNotificationChannel();
            
            Intent notificationIntent = new Intent(this, getMainActivityClass());
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("IRopit")
                .setContentText("Syncing notifications...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(FOREGROUND_NOTIFICATION_ID, notification, 
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(FOREGROUND_NOTIFICATION_ID, notification);
            }
            
            Log.i(TAG, "Foreground service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "IRopit Sync Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps IRopit running to sync your notifications");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Class<?> getMainActivityClass() {
        try {
            return Class.forName("com.IRopit.MainActivity");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "MainActivity not found");
            return null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        processedKeys.clear();
        lastNotificationTime.clear();
        Log.i(TAG, "=== NotificationService DESTROYED ===");
        
        // Request rebind when destroyed
        requestRebind();
    }
    
    private void requestRebind() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                android.content.ComponentName componentName = new android.content.ComponentName(
                    getPackageName(), 
                    NotificationService.class.getName()
                );
                NotificationListenerService.requestRebind(componentName);
                Log.i(TAG, "Requested rebind after destruction");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting rebind: " + e.getMessage());
        }
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        serviceStartTime = System.currentTimeMillis();
        Log.i(TAG, "=== NotificationService CONNECTED ===");
        
        // Ensure foreground service is running
        startForegroundServiceWithNotification();
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.i(TAG, "=== NotificationService DISCONNECTED ===");
        
        // Try to reconnect
        requestRebind();
    }

    public static NotificationService getInstance() {
        return instance;
    }

    public static boolean isConnected() {
        return instance != null;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) {
            Log.w(TAG, "Received null notification");
            return;
        }

        String packageName = sbn.getPackageName();
        String key = sbn.getKey();
        long postTime = sbn.getPostTime();
        long now = System.currentTimeMillis();

        // Log ALL notifications for WhatsApp debugging
        if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
            Log.i(TAG, "🟢 WHATSAPP NOTIFICATION RECEIVED: " + key);
        }

        // Skip our own notifications
        if (packageName.equals("com.IRopit")) {
            return;
        }

        // Skip notifications older than service start (already existing)
        if (postTime < serviceStartTime) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping old notification (posted before service started)");
            }
            Log.d(TAG, "Skipping old notification: " + key + " (posted before service started)");
            return;
        }

        // For Google apps and repetitive notification apps, apply stricter time filter
        // Only allow notifications from the last 10 seconds to ensure they're truly new
        if (isRepetitiveNotificationApp(packageName)) {
            if (now - postTime > 10000) {
                Log.d(TAG, "Skipping old notification from repetitive app " + packageName + " (older than 10s)");
                return;
            }
        }

        // Skip if notification is older than 30 seconds
        if (now - postTime > 30000) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping stale notification (older than 30s)");
            }
            Log.d(TAG, "Skipping stale notification: " + key + " (older than 30s)");
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null) {
            Log.w(TAG, "Notification object is null for: " + packageName);
            return;
        }

        // Skip group summary notifications
        if ((notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping group summary");
            }
            Log.d(TAG, "Skipping group summary: " + key);
            return;
        }

        // Check for duplicate
        Long lastTime = lastNotificationTime.get(key);
        if (lastTime != null && (now - lastTime) < DUPLICATE_THRESHOLD_MS) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping duplicate notification");
            }
            Log.d(TAG, "Skipping duplicate notification: " + key);
            return;
        }

        Bundle extras = notification.extras;
        String title = "";
        String text = "";
        String bigText = "";
        String subText = "";

        if (extras != null) {
            CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence subTextCs = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);

            title = titleCs != null ? titleCs.toString() : "";
            text = textCs != null ? textCs.toString() : "";
            bigText = bigTextCs != null ? bigTextCs.toString() : "";
            subText = subTextCs != null ? subTextCs.toString() : "";
        }

        // Skip if both title and text are empty
        if (title.isEmpty() && text.isEmpty()) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping empty notification");
            }
            Log.d(TAG, "Skipping empty notification from: " + packageName);
            return;
        }

        // Skip summary-style notifications (e.g., "X messages from Y chats")
        if (isSummaryText(text)) {
            if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
                Log.d(TAG, "🔴 WHATSAPP: Skipping summary notification: " + text);
            }
            Log.d(TAG, "Skipping summary notification: " + text);
            return;
        }

        // For apps that repeatedly notify about unread messages (Gmail, Google, etc.)
        // Check if we've already processed the same content recently
        if (isRepetitiveNotificationApp(packageName)) {
            String contentKey = packageName + "_" + title + "_" + text;
            String lastContentTime = lastNotificationContent.get(contentKey);
            if (lastContentTime != null) {
                long lastTime2 = Long.parseLong(lastContentTime);
                if ((now - lastTime2) < CONTENT_DUPLICATE_THRESHOLD_MS) {
                    Log.d(TAG, "Skipping duplicate content from " + packageName + ": " + title);
                    return;
                }
            }
            // Store this content with timestamp
            lastNotificationContent.put(contentKey, String.valueOf(now));
        }

        String type = getNotificationType(packageName, title, text);
        String appName = getAppName(packageName);
        boolean isMissedCall = isMissedCallNotification(packageName, title, text);
        String appIcon = getAppIconBase64(packageName);

        // Update tracking
        lastNotificationTime.put(key, now);
        processedKeys.add(key);

        Log.i(TAG, ">>> NEW NOTIFICATION <<<");
        Log.i(TAG, "  Package: " + packageName);
        Log.i(TAG, "  App: " + appName);
        Log.i(TAG, "  Type: " + type);
        Log.i(TAG, "  Title: " + title);
        Log.i(TAG, "  Text: " + text);
        Log.i(TAG, "  Is Missed Call: " + isMissedCall);
        Log.i(TAG, "  Has App Icon: " + (appIcon != null));
        Log.i(TAG, "  Post Time: " + postTime + " (age: " + (now - postTime) + "ms)");

        if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
            Log.i(TAG, "🟢 WHATSAPP NOTIFICATION ACCEPTED AND WILL BE SAVED!");
        }

        // Always send to Firebase (works even when app is closed)
        sendToFirebase(sbn.getId(), key, packageName, title, text, bigText, subText,
                type, postTime, appName, isMissedCall, appIcon);

        // Try to send to React Native (only works when app is open)
        WritableMap params = Arguments.createMap();
        params.putString("id", String.valueOf(sbn.getId()));
        params.putString("key", key);
        params.putString("packageName", packageName);
        params.putString("title", title);
        params.putString("text", text);
        params.putString("bigText", bigText);
        params.putString("subText", subText);
        params.putString("type", type);
        params.putDouble("timestamp", postTime);
        params.putString("appName", appName);
        params.putBoolean("isMissedCall", isMissedCall);
        params.putBoolean("isNew", true);
        if (appIcon != null) {
            params.putString("appIcon", appIcon);
        }

        sendEventToReact("onNotificationReceived", params);
    }

    /**
     * Send notification directly to Firebase Firestore
     */
    private void sendToFirebase(int id, String key, String packageName, String title,
            String text, String bigText, String subText, String type,
            long timestamp, String appName, boolean isMissedCall, String appIcon) {
        try {
            if (firebaseHelper != null && firebaseHelper.isLoggedIn()) {
                firebaseHelper.sendNotificationToFirestore(
                    String.valueOf(id), key, packageName, title, text,
                    bigText, subText, type, timestamp, appName, isMissedCall, appIcon
                );
                Log.i(TAG, "Notification queued for Firebase");
            } else {
                Log.d(TAG, "User not logged in, skipping Firebase");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending to Firebase: " + e.getMessage());
        }
    }

    /**
     * Check if text is a summary or system notification (not a real message)
     */
    private boolean isSummaryText(String text) {
        if (text == null || text.isEmpty()) return false;

        String lower = text.toLowerCase();

        // System/background notifications - NOT real messages
        if (lower.contains("doing work in the background") ||
            lower.contains("working in background") ||
            lower.contains("running in background") ||
            lower.contains("is running") ||
            lower.contains("تعمل في الخلفية") ||
            lower.contains("يعمل في الخلفية")) {
            return true;
        }

        // Common summary patterns
        return lower.matches(".*\\d+\\s*(messages?|msgs?)\\s*(from|in)\\s*\\d+.*") ||
               lower.contains("new messages") ||
               lower.contains("messages from") ||
               lower.contains("unread messages") ||
               lower.matches(".*\\d+\\s*رسائل.*") ||
               lower.matches(".*\\d+\\s*رسالة.*");
    }

    /**
     * Check if this app tends to repeatedly send the same notification
     * (like Gmail showing unread count, or Google notifications)
     */
    private boolean isRepetitiveNotificationApp(String packageName) {
        if (packageName == null) return false;
        
        return packageName.equals("com.google.android.gm") ||           // Gmail
               packageName.equals("com.google.android.apps.inbox") ||    // Inbox
               packageName.equals("com.google.android.apps.messaging") || // Google Messages
               packageName.contains("com.google") ||                     // Any Google app
               packageName.equals("com.microsoft.office.outlook") ||     // Outlook
               packageName.equals("com.yahoo.mobile.client.android.mail"); // Yahoo Mail
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;

        String key = sbn.getKey();

        // Clean up tracking
        processedKeys.remove(key);
        lastNotificationTime.remove(key);

        Log.d(TAG, "Notification removed: " + key);

        WritableMap params = Arguments.createMap();
        params.putString("key", key);
        params.putString("packageName", sbn.getPackageName());

        sendEventToReact("onNotificationRemoved", params);
    }

    private boolean isSmsPackage(String packageName) {
        if (packageName == null) return false;

        for (String pkg : SMS_PACKAGES) {
            if (packageName.equals(pkg)) return true;
        }

        return packageName.contains("messaging") ||
               packageName.contains("mms") ||
               packageName.contains("sms");
    }

    private boolean isPhonePackage(String packageName) {
        if (packageName == null) return false;

        for (String pkg : PHONE_PACKAGES) {
            if (packageName.equals(pkg)) return true;
        }

        return packageName.contains("dialer") ||
               packageName.contains("phone") ||
               packageName.contains("incallui");
    }

    private boolean isMissedCallNotification(String packageName, String title, String text) {
        String combined = (title + " " + text).toLowerCase();

        // Check for WhatsApp missed calls
        if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
            if (combined.contains("missed") && (combined.contains("call") || combined.contains("voice"))) {
                return true;
            }
            // Arabic patterns for WhatsApp
            if (combined.contains("فائت") || combined.contains("لم يرد")) {
                return true;
            }
        }

        // Check for phone app missed calls
        if (isPhonePackage(packageName)) {
            // English patterns
            if (combined.contains("missed call") || combined.contains("missed calls")) {
                return true;
            }

            // Arabic patterns
            if (combined.contains("مكالمة فائتة") || combined.contains("مكالمات فائتة")) {
                return true;
            }

            // Other language patterns
            if (combined.contains("appel manqué") ||  // French
                combined.contains("llamada perdida") || // Spanish
                combined.contains("verpasster anruf")) { // German
                return true;
            }
        }

        return false;
    }

    private String getNotificationType(String packageName, String title, String text) {
        if (packageName == null) return "other";

        if (isSmsPackage(packageName)) {
            return "sms";
        }

        if (isPhonePackage(packageName)) {
            if (isMissedCallNotification(packageName, title, text)) {
                return "missed_call";
            }
            return "call";
        }

        if (packageName.equals("com.whatsapp") ||
            packageName.equals("com.whatsapp.w4b")) {
            // Check if it's a WhatsApp call
            if (isMissedCallNotification(packageName, title, text)) {
                return "whatsapp_call";
            }
            return "whatsapp";
        }

        if (packageName.equals("org.telegram.messenger") ||
            packageName.contains("telegram")) {
            return "telegram";
        }

        if (packageName.equals("com.facebook.orca") ||
            packageName.equals("com.facebook.mlite")) {
            return "messenger";
        }

        if (packageName.equals("com.instagram.android")) {
            return "instagram";
        }

        if (packageName.equals("com.twitter.android") ||
            packageName.equals("com.twitter.android.lite")) {
            return "twitter";
        }

        if (packageName.contains("mail") ||
            packageName.contains("gmail") ||
            packageName.contains("email")) {
            return "email";
        }

        return "other";
    }

    private String getAppName(String packageName) {
        try {
            return getPackageManager().getApplicationLabel(
                getPackageManager().getApplicationInfo(packageName, 0)
            ).toString();
        } catch (Exception e) {
            Log.e(TAG, "Error getting app name: " + e.getMessage());
            return packageName;
        }
    }

    /**
     * Get app icon as Base64 string
     * Uses caching to avoid repeated conversions
     */
    private String getAppIconBase64(String packageName) {
        // Check cache first
        if (iconCache.containsKey(packageName)) {
            return iconCache.get(packageName);
        }

        try {
            PackageManager pm = getPackageManager();
            Drawable drawable = pm.getApplicationIcon(packageName);
            
            // Convert drawable to bitmap
            Bitmap bitmap;
            if (drawable instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) drawable).getBitmap();
            } else {
                // Create bitmap from drawable
                int width = drawable.getIntrinsicWidth() > 0 ? drawable.getIntrinsicWidth() : 48;
                int height = drawable.getIntrinsicHeight() > 0 ? drawable.getIntrinsicHeight() : 48;
                bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
            }

            // Scale down to 48x48 for smaller size
            Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, 48, 48, true);

            // Convert to Base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 80, baos);
            byte[] imageBytes = baos.toByteArray();
            String base64 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
            
            // Add data URI prefix
            String dataUri = "data:image/png;base64," + base64;

            // Cache it
            iconCache.put(packageName, dataUri);

            Log.d(TAG, "App icon cached for: " + packageName + " (size: " + dataUri.length() + " chars)");
            return dataUri;

        } catch (Exception e) {
            Log.e(TAG, "Error getting app icon: " + e.getMessage());
            return null;
        }
    }

    private void sendEventToReact(final String eventName, final WritableMap params) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    ReactApplication app = (ReactApplication) getApplication();
                    if (app == null) {
                        Log.d(TAG, "ReactApplication is null - app might be closed");
                        return;
                    }

                    ReactHost reactHost = app.getReactHost();
                    if (reactHost == null) {
                        Log.d(TAG, "ReactHost is null - app might be closed");
                        return;
                    }

                    ReactContext context = reactHost.getCurrentReactContext();
                    if (context == null) {
                        Log.d(TAG, "ReactContext is null - app might be closed");
                        return;
                    }

                    if (!context.hasActiveReactInstance()) {
                        Log.d(TAG, "No active React instance - app might be closed");
                        return;
                    }

                    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit(eventName, params);

                    Log.i(TAG, "Event sent to React: " + eventName);

                } catch (Exception e) {
                    Log.d(TAG, "Could not send to React (app closed?): " + e.getMessage());
                }
            }
        });
    }
}

