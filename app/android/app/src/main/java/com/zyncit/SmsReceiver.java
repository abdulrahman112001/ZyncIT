package com.zyncit;

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

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static ReactApplicationContext reactContext;
    
    // Set لتتبع الرسائل التي تم معالجتها لتجنب التكرار
    private static final Set<String> processedMessages = new HashSet<>();
    private static final long MESSAGE_EXPIRY_MS = 5000; // 5 ثوان
    
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
            Log.e(TAG, "Error getting contact name", e);
        }

        return "";
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
