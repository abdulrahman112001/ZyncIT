package com.IRopit;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static ReactApplicationContext reactContext;
    
    // Set لتتبع الرسائل التي تم معالجتها لتجنب التكرار
    private static final Set<String> processedMessages = new HashSet<>();
    private static final long MESSAGE_EXPIRY_MS = 5000; // 5 ثوان
    
    // Track recently captured SMS so NotificationService can avoid duplicates
    private static final ConcurrentHashMap<String, Long> recentlyCapturedSms = new ConcurrentHashMap<>();
    private static final long DEDUP_WINDOW_MS = 30000; // 30 seconds
    
    /**
     * Check if an SMS from this sender was recently captured by SmsReceiver.
     * Used by NotificationService to avoid duplicate processing.
     */
    public static boolean wasRecentlyCaptured(String sender, long timestamp) {
        if (sender == null) return false;
        String normalizedSender = sender.replaceAll("[^0-9+]", "");
        // Check by sender (any recent SMS from this sender)
        Long capturedTime = recentlyCapturedSms.get(normalizedSender);
        if (capturedTime != null && Math.abs(capturedTime - timestamp) < DEDUP_WINDOW_MS) {
            return true;
        }
        // Also check last 4 digits (for format differences)
        if (normalizedSender.length() >= 4) {
            String last4 = normalizedSender.substring(normalizedSender.length() - 4);
            for (java.util.Map.Entry<String, Long> entry : recentlyCapturedSms.entrySet()) {
                if (entry.getKey().endsWith(last4) && Math.abs(entry.getValue() - timestamp) < DEDUP_WINDOW_MS) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // تنظيف الرسائل القديمة من الـ Set
    private static class MessageCleanupTask implements Runnable {
        private final String messageKey;
        
        MessageCleanupTask(String key) {
            this.messageKey = key;
        }
        
        @Override
        public void run() {
            processedMessages.remove(messageKey);
        }
    }

    public static void setReactContext(ReactApplicationContext context) {
        reactContext = context;
        Log.d(TAG, "React context set");
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "=== SMS RECEIVER TRIGGERED ===");
        Log.d(TAG, "onReceive called with action: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent == null) {
            Log.e(TAG, "Intent is null!");
            return;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "Processing action: " + action);
        
        if ("android.provider.Telephony.SMS_RECEIVED".equals(action)) {
            Log.d(TAG, "SMS_RECEIVED action matched!");
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                
                if (pdus != null) {
                    StringBuilder fullMessage = new StringBuilder();
                    String sender = null;
                    long timestamp = System.currentTimeMillis();
                    
                    for (Object pdu : pdus) {
                        SmsMessage sms;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                        } else {
                            sms = SmsMessage.createFromPdu((byte[]) pdu);
                        }
                        
                        if (sms != null) {
                            if (sender == null) {
                                sender = sms.getOriginatingAddress();
                                timestamp = sms.getTimestampMillis();
                            }
                            fullMessage.append(sms.getMessageBody());
                        }
                    }
                    
                    Log.d(TAG, "SMS received from: " + sender + ", message: " + fullMessage.toString());
                    
                    // إنشاء مفتاح فريد للرسالة (sender + timestamp + message hash)
                    String messageKey = sender + "_" + timestamp + "_" + fullMessage.toString().hashCode();
                    
                    // التحقق من أن الرسالة لم تتم معالجتها مسبقاً
                    if (processedMessages.contains(messageKey)) {
                        Log.w(TAG, "⏭️ Duplicate SMS detected, skipping: " + messageKey);
                        return;
                    }
                    
                    // إضافة للقائمة المعالجة
                    processedMessages.add(messageKey);
                    Log.d(TAG, "✅ New unique SMS, processing: " + messageKey);
                    
                    // جدولة إزالة المفتاح بعد 5 ثوان لتجنب memory leak
                    android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
                    handler.postDelayed(new MessageCleanupTask(messageKey), MESSAGE_EXPIRY_MS);
                    
                    // جلب اسم جهة الاتصال
                    String contactName = getContactName(context, sender);
                    
                    sendSmsEvent(context, sender, fullMessage.toString(), timestamp, contactName);
                }
            }
        }
    }
    
    private String getContactName(Context context, String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return "";
        }

        try {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) 
                    != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "READ_CONTACTS permission not granted");
                return "";
            }
            
            ContentResolver resolver = context.getContentResolver();
            
            // Try with original number first
            String name = lookupContactByPhone(resolver, phoneNumber);
            if (name != null && !name.isEmpty()) {
                return name;
            }
            
            // Clean the phone number - remove spaces, dashes, etc.
            String cleanNumber = phoneNumber.replaceAll("[^\\d+]", "");
            
            // Try with clean number
            if (!cleanNumber.equals(phoneNumber)) {
                name = lookupContactByPhone(resolver, cleanNumber);
                if (name != null && !name.isEmpty()) {
                    return name;
                }
            }
            
            // Try without country code (if starts with +)
            if (cleanNumber.startsWith("+")) {
                // Remove + and country code (assume 1-3 digits)
                String withoutPlus = cleanNumber.substring(1);
                
                // Try removing common country codes
                String[] prefixes = {"971", "966", "965", "974", "973", "968", "20", "1", "44", "91"};
                for (String prefix : prefixes) {
                    if (withoutPlus.startsWith(prefix)) {
                        String localNumber = withoutPlus.substring(prefix.length());
                        // Add leading 0 for local format
                        name = lookupContactByPhone(resolver, "0" + localNumber);
                        if (name != null && !name.isEmpty()) {
                            Log.d(TAG, "Found contact with local format: 0" + localNumber);
                            return name;
                        }
                        // Try without leading 0
                        name = lookupContactByPhone(resolver, localNumber);
                        if (name != null && !name.isEmpty()) {
                            return name;
                        }
                    }
                }
            }
            
            // Try adding country code if number starts with 0
            if (cleanNumber.startsWith("0")) {
                String withoutZero = cleanNumber.substring(1);
                // Try UAE format
                name = lookupContactByPhone(resolver, "+971" + withoutZero);
                if (name != null && !name.isEmpty()) {
                    return name;
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting contact name", e);
        }

        return "";
    }
    
    private String lookupContactByPhone(ContentResolver resolver, String phoneNumber) {
        try {
            Uri uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            );

            String[] projection = new String[]{ContactsContract.PhoneLookup.DISPLAY_NAME};
            Cursor cursor = resolver.query(uri, projection, null, null, null);

            if (cursor != null) {
                try {
                    if (cursor.moveToFirst()) {
                        String name = cursor.getString(0);
                        Log.d(TAG, "Found contact name: " + name + " for number: " + phoneNumber);
                        return name;
                    }
                } finally {
                    cursor.close();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error looking up contact: " + phoneNumber, e);
        }
        return null;
    }
    
    private void sendSmsEvent(Context context, String sender, String message, long timestamp, String contactName) {
        // Always try to save to Firebase using background service
        try {
            Intent backgroundIntent = new Intent(context, BackgroundSmsService.class);
            backgroundIntent.putExtra("sender", sender);
            backgroundIntent.putExtra("message", message);
            backgroundIntent.putExtra("contactName", contactName);
            backgroundIntent.putExtra("timestamp", timestamp);
            context.startService(backgroundIntent);
            Log.d(TAG, "Starting BackgroundSmsService to save SMS");
        } catch (Exception e) {
            Log.e(TAG, "Error starting BackgroundSmsService", e);
        }
        
        // Also send to React if available
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("id", String.valueOf(System.currentTimeMillis()));
            params.putString("sender", sender != null ? sender : "Unknown");
            params.putString("contactName", contactName != null ? contactName : "");
            params.putString("message", message);
            params.putDouble("timestamp", timestamp);

            Log.d(TAG, "Sending SMS event to React Native - sender: " + sender + ", contact: " + contactName);
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSmsReceived", params);
        } else {
            Log.w(TAG, "Cannot send SMS event, no active React instance - but will save to Firebase");
        }
    }

    private void saveSmsToFirebaseBackground(String sender, String message, long timestamp, String contactName) {
        // This will be called from background and save SMS directly to Firebase
        new Thread(() -> {
            try {
                Log.d(TAG, "Saving SMS to Firebase in background...");
                // SMS will be saved by BackgroundSmsService when it's started
            } catch (Exception e) {
                Log.e(TAG, "Error saving SMS to Firebase", e);
            }
        }).start();
    }
}

