package com.IRopit;

import android.Manifest;
import android.content.ContentResolver;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CallLog.Calls;
import android.provider.ContactsContract;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class CallLogModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CallLogModule";
    private final ReactApplicationContext reactContext;
    private CallReceiver callReceiver;
    private boolean isReceiverRegistered = false;

    public CallLogModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        CallReceiver.setReactContext(reactContext);
    }

    @Override
    public String getName() {
        return "CallLogModule";
    }

    @ReactMethod
    public void getCallLog(int limit, Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CALL_LOG)
                    != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Call log permission not granted");
                return;
            }

            WritableArray callList = Arguments.createArray();
            ContentResolver cr = reactContext.getContentResolver();
            
            Cursor cursor = cr.query(
                Calls.CONTENT_URI,
                new String[]{
                    Calls._ID,
                    Calls.NUMBER,
                    Calls.CACHED_NAME,
                    Calls.TYPE,
                    Calls.DATE,
                    Calls.DURATION
                },
                null,
                null,
                Calls.DATE + " DESC"
            );

            int count = 0;
            if (cursor != null && cursor.moveToFirst()) {
                do {
                    if (count >= limit) break;
                    
                    WritableMap call = Arguments.createMap();
                    call.putString("id", cursor.getString(0));
                    call.putString("phoneNumber", cursor.getString(1));
                    call.putString("contactName", cursor.getString(2));
                    
                    int type = cursor.getInt(3);
                    String callType;
                    switch (type) {
                        case Calls.INCOMING_TYPE:
                            callType = "incoming";
                            break;
                        case Calls.OUTGOING_TYPE:
                            callType = "outgoing";
                            break;
                        case Calls.MISSED_TYPE:
                            callType = "missed";
                            break;
                        case Calls.REJECTED_TYPE:
                            callType = "rejected";
                            break;
                        default:
                            callType = "unknown";
                    }
                    call.putString("type", callType);
                    call.putDouble("timestamp", cursor.getLong(4));
                    call.putInt("duration", cursor.getInt(5));
                    
                    callList.pushMap(call);
                    count++;
                } while (cursor.moveToNext());
                cursor.close();
            }

            Log.d(TAG, "Loaded " + callList.size() + " calls from device");
            promise.resolve(callList);
        } catch (Exception e) {
            Log.e(TAG, "Error getting call log", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startListening(Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE)
                    != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Phone state permission not granted");
                return;
            }

            if (!isReceiverRegistered) {
                callReceiver = new CallReceiver();
                IntentFilter intentFilter = new IntentFilter();
                intentFilter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
                intentFilter.addAction("android.intent.action.NEW_OUTGOING_CALL");
                reactContext.registerReceiver(callReceiver, intentFilter);
                isReceiverRegistered = true;
            }

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to start call listener: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopListening(Promise promise) {
        try {
            if (isReceiverRegistered && callReceiver != null) {
                reactContext.unregisterReceiver(callReceiver);
                isReceiverRegistered = false;
                callReceiver = null;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to stop call listener: " + e.getMessage());
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
}

