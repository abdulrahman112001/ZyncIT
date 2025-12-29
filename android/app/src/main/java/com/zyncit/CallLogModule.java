package com.zyncit;

import android.Manifest;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.telephony.TelephonyManager;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CallLogModule extends ReactContextBaseJavaModule {
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
