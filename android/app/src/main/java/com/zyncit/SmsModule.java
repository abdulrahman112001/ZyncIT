package com.zyncit;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.telephony.SmsManager;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;

public class SmsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsModule";
    private final ReactApplicationContext reactContext;

    public SmsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        
        // Set the context for SmsReceiver so it can emit events
        SmsReceiver.setReactContext(reactContext);
        Log.d(TAG, "SmsModule initialized, context set for SmsReceiver");
    }

    @Override
    public String getName() {
        return "SmsModule";
    }

    @ReactMethod
    public void getAllSms(int limit, Promise promise) {
        try {
            WritableArray smsList = Arguments.createArray();
            ContentResolver cr = reactContext.getContentResolver();
            Cursor cursor = cr.query(
                Uri.parse("content://sms/inbox"),
                new String[]{"_id", "address", "body", "date", "read"},
                null, null, "date DESC LIMIT " + limit
            );

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    WritableMap sms = Arguments.createMap();
                    sms.putString("id", cursor.getString(0));
                    sms.putString("address", cursor.getString(1));
                    sms.putString("body", cursor.getString(2));
                    sms.putDouble("date", cursor.getLong(3));
                    sms.putBoolean("read", cursor.getInt(4) == 1);
                    smsList.pushMap(sms);
                } while (cursor.moveToNext());
                cursor.close();
            }

            promise.resolve(smsList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void sendSms(String phoneNumber, String message, Promise promise) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            ArrayList<String> parts = smsManager.divideMessage(message);
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    public void removeListeners(int count) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    public void getContactName(String phoneNumber, Promise promise) {
        try {
            String contactName = null;
            Uri uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            );
            
            Cursor cursor = reactContext.getContentResolver().query(
                uri,
                new String[]{ContactsContract.PhoneLookup.DISPLAY_NAME},
                null, null, null
            );
            
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    contactName = cursor.getString(0);
                }
                cursor.close();
            }
            
            promise.resolve(contactName);
        } catch (Exception e) {
            promise.resolve(null);
        }
    }
}