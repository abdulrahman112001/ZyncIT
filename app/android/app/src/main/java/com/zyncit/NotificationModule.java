package com.zyncit;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.telephony.SmsManager;
import android.Manifest;
import android.content.pm.PackageManager;
import android.service.notification.NotificationListenerService;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = NotificationModule.NAME)
public class NotificationModule extends ReactContextBaseJavaModule {
    public static final String NAME = "NotificationModule";
    private final ReactApplicationContext reactContext;

    public NotificationModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void isPermissionGranted(Promise promise) {
        try {
            String packageName = reactContext.getPackageName();
            String flat = Settings.Secure.getString(
                reactContext.getContentResolver(),
                "enabled_notification_listeners"
            );

            if (flat != null && !TextUtils.isEmpty(flat)) {
                String[] names = flat.split(":");
                for (String name : names) {
                    ComponentName cn = ComponentName.unflattenFromString(name);
                    if (cn != null && cn.getPackageName().equals(packageName)) {
                        promise.resolve(true);
                        return;
                    }
                }
            }
            promise.resolve(false);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isServiceConnected(Promise promise) {
        // First check if instance exists
        if (NotificationService.isConnected()) {
            promise.resolve(true);
            return;
        }

        // Fallback: check if permission is granted (service might be running but instance not set yet)
        try {
            String packageName = reactContext.getPackageName();
            String flat = Settings.Secure.getString(
                reactContext.getContentResolver(),
                "enabled_notification_listeners"
            );

            if (flat != null && !TextUtils.isEmpty(flat)) {
                String[] names = flat.split(":");
                for (String name : names) {
                    ComponentName cn = ComponentName.unflattenFromString(name);
                    if (cn != null && cn.getPackageName().equals(packageName)) {
                        // Permission granted, request rebind
                        try {
                            ComponentName componentName = new ComponentName(
                                reactContext.getPackageName(),
                                NotificationService.class.getName()
                            );
                            NotificationListenerService.requestRebind(componentName);
                        } catch (Exception ignored) {}

                        promise.resolve(true);
                        return;
                    }
                }
            }
            promise.resolve(false);
        } catch (Exception e) {
            promise.resolve(NotificationService.isConnected());
        }
    }

    @ReactMethod
    public void sendSMS(String phoneNumber, String message, Promise promise) {
        try {
            // Check if SMS permission is granted
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.SEND_SMS)
                    != PackageManager.PERMISSION_GRANTED) {
                promise.resolve(false);
                return;
            }

            SmsManager smsManager = SmsManager.getDefault();

            // If message is too long, split it
            if (message.length() > 160) {
                java.util.ArrayList<String> parts = smsManager.divideMessage(message);
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null);
            }

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SMS_ERROR", e.getMessage());
        }
    }
}
