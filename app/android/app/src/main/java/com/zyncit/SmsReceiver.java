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

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static ReactApplicationContext reactContext;

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
                    
                    // جلب اسم جهة الاتصال
                    String contactName = getContactName(context, sender);
                    
                    sendSmsEvent(sender, fullMessage.toString(), timestamp, contactName);
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
    
    private void sendSmsEvent(String sender, String message, long timestamp, String contactName) {
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
            Log.w(TAG, "Cannot send SMS event, no active React instance");
        }
    }
}
