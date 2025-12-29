package com.zyncit;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

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
        Log.d(TAG, "onReceive called with action: " + intent.getAction());
        
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
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
                    
                    sendSmsEvent(sender, fullMessage.toString(), timestamp);
                }
            }
        }
    }
    
    private void sendSmsEvent(String sender, String message, long timestamp) {
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("id", String.valueOf(System.currentTimeMillis()));
            params.putString("sender", sender != null ? sender : "Unknown");
            params.putString("message", message);
            params.putDouble("timestamp", timestamp);

            Log.d(TAG, "Sending SMS event to React Native");
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSmsReceived", params);
        } else {
            Log.w(TAG, "Cannot send SMS event, no active React instance");
        }
    }
}
