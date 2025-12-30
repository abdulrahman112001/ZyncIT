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
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CallReceiver extends BroadcastReceiver {
    private static final String TAG = "CallReceiver";
    private static ReactApplicationContext reactContext;
    private static String lastState = "";
    private static String lastNumber = "";
    private static long callStartTime = 0;
    private static boolean isIncoming = false;
    private static boolean callEventSent = false;

    public static void setReactContext(ReactApplicationContext context) {
        reactContext = context;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "onReceive: " + action);

        if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
            String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
            String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
            Log.d(TAG, "Phone state: " + state + ", number from intent: " + phoneNumber);

            // Always save the phone number if we get it
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                lastNumber = phoneNumber;
                Log.d(TAG, "Saved lastNumber: " + lastNumber);
            }

            if (state != null && !state.equals(lastState)) {
                handleStateChange(context, state, phoneNumber);
                lastState = state;
            }
        } else if ("android.intent.action.NEW_OUTGOING_CALL".equals(action)) {
            String phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
            Log.d(TAG, "Outgoing call to: " + phoneNumber);
            if (phoneNumber != null) {
                lastNumber = phoneNumber;
                isIncoming = false;
                callStartTime = System.currentTimeMillis();
                callEventSent = false;
            }
        }
    }

    private void handleStateChange(Context context, String state, String phoneNumber) {
        Log.d(TAG, "handleStateChange: " + state + ", number: " + phoneNumber + ", lastNumber: " + lastNumber);

        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            // Incoming call ringing
            isIncoming = true;
            callEventSent = false;
            callStartTime = System.currentTimeMillis();

            // Send ringing event if we have a number
            if (lastNumber != null && !lastNumber.isEmpty()) {
                String contactName = getContactName(context, lastNumber);
                sendEvent("onCallReceived", createCallMap(lastNumber, contactName, "incoming", "ringing", 0));
            }
            
        } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
            // Call answered or outgoing call started
            String contactName = getContactName(context, lastNumber);
            if (isIncoming) {
                sendEvent("onCallReceived", createCallMap(lastNumber, contactName, "incoming", "answered", 0));
            } else if (!callEventSent) {
                sendEvent("onCallReceived", createCallMap(lastNumber, contactName, "outgoing", "started", 0));
                callEventSent = true;
            }

        } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
            // Call ended
            if (callStartTime > 0) {
                // Wait a moment for call log to update, then fetch the last call
                final String savedNumber = lastNumber;
                final boolean wasIncoming = isIncoming;
                final long savedStartTime = callStartTime;
                
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    fetchLastCallAndSendEvent(context, savedNumber, wasIncoming, savedStartTime);
                }, 1500);
            }
            
            // Reset state
            callStartTime = 0;
            lastNumber = "";
            isIncoming = false;
            callEventSent = false;
        }
    }

    private void fetchLastCallAndSendEvent(Context context, String savedNumber, boolean wasIncoming, long savedStartTime) {
        String number = savedNumber;
        String name = "";
        String type = wasIncoming ? "incoming" : "outgoing";
        int duration = (int) ((System.currentTimeMillis() - savedStartTime) / 1000);
        
        try {
            // Check permission
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALL_LOG) 
                    == PackageManager.PERMISSION_GRANTED) {
                
                ContentResolver resolver = context.getContentResolver();
                // Query without LIMIT in sortOrder - use separate limit parameter
                Cursor cursor = resolver.query(
                    CallLog.Calls.CONTENT_URI,
                    new String[]{
                        CallLog.Calls.NUMBER,
                        CallLog.Calls.CACHED_NAME,
                        CallLog.Calls.TYPE,
                        CallLog.Calls.DURATION,
                        CallLog.Calls.DATE
                    },
                    null,
                    null,
                    CallLog.Calls.DATE + " DESC"
                );

                if (cursor != null) {
                    try {
                        if (cursor.moveToFirst()) {
                            String logNumber = cursor.getString(0);
                            String logName = cursor.getString(1);
                            int logType = cursor.getInt(2);
                            int logDuration = cursor.getInt(3);
                            long logDate = cursor.getLong(4);

                            Log.d(TAG, "Call log: number=" + logNumber + ", name=" + logName + 
                                       ", type=" + logType + ", duration=" + logDuration);

                            // Only use call log data if it's recent (within last 30 seconds)
                            if (System.currentTimeMillis() - logDate < 30000) {
                                if (logNumber != null && !logNumber.isEmpty()) {
                                    number = logNumber;
                                }
                                if (logName != null && !logName.isEmpty()) {
                                    name = logName;
                                }
                                duration = logDuration;
                                
                                switch (logType) {
                                    case CallLog.Calls.INCOMING_TYPE:
                                        type = "incoming";
                                        break;
                                    case CallLog.Calls.OUTGOING_TYPE:
                                        type = "outgoing";
                                        break;
                                    case CallLog.Calls.MISSED_TYPE:
                                        type = "missed";
                                        break;
                                    case CallLog.Calls.REJECTED_TYPE:
                                        type = "rejected";
                                        break;
                                }
                            }
                        }
                    } finally {
                        cursor.close();
                    }
                }
            } else {
                Log.w(TAG, "READ_CALL_LOG permission not granted");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error fetching call log", e);
        }
        
        // If still no name, try to get from contacts
        if ((name == null || name.isEmpty()) && number != null && !number.isEmpty()) {
            name = getContactName(context, number);
        }
        
        // Check for missed call
        if (wasIncoming && duration < 3) {
            type = "missed";
        }

        sendEvent("onCallReceived", createCallMap(number, name, type, "ended", duration));
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

    private WritableMap createCallMap(String phoneNumber, String contactName, String type, String status, int duration) {
        WritableMap map = Arguments.createMap();
        map.putString("id", String.valueOf(System.currentTimeMillis()));
        map.putString("phoneNumber", phoneNumber != null && !phoneNumber.isEmpty() ? phoneNumber : "Unknown");
        map.putString("contactName", contactName != null ? contactName : "");
        map.putString("type", type);
        map.putString("status", status);
        map.putDouble("timestamp", System.currentTimeMillis());
        map.putInt("duration", duration);

        Log.d(TAG, "createCallMap: phone=" + phoneNumber + ", contact=" + contactName + ", type=" + type + ", status=" + status);
        return map;
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            Log.d(TAG, "Sending event: " + eventName);
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        } else {
            Log.w(TAG, "Cannot send event, no active React instance");
        }
    }
}
