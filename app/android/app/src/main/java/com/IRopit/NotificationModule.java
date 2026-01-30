package com.IRopit;

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
        // Only return true if service instance actually exists and is connected
        // Don't use permission check as fallback - MIUI can have permission but block the service
        boolean isConnected = NotificationService.isConnected();
        
        // If not connected but permission is granted, try to request rebind
        if (!isConnected) {
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
                            // Permission granted but not connected - try rebind
                            try {
                                ComponentName componentName = new ComponentName(
                                    reactContext.getPackageName(),
                                    NotificationService.class.getName()
                                );
                                NotificationListenerService.requestRebind(componentName);
                            } catch (Exception ignored) {}
                            break;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        
        promise.resolve(isConnected);
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

    /**
     * Open MIUI AutoStart settings to allow the app to start automatically
     * This is required for NotificationListenerService to work on MIUI devices
     */
    @ReactMethod
    public void openAutoStartSettings(Promise promise) {
        try {
            Intent intent = new Intent();
            String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
            
            if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco")) {
                // MIUI AutoStart settings
                intent.setComponent(new ComponentName("com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"));
            } else if (manufacturer.contains("oppo")) {
                // OPPO AutoStart settings
                intent.setComponent(new ComponentName("com.coloros.safecenter",
                    "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
            } else if (manufacturer.contains("vivo")) {
                // Vivo AutoStart settings
                intent.setComponent(new ComponentName("com.vivo.permissionmanager",
                    "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
            } else if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
                // Huawei AutoStart settings
                intent.setComponent(new ComponentName("com.huawei.systemmanager",
                    "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"));
            } else if (manufacturer.contains("samsung")) {
                // Samsung doesn't have traditional AutoStart, open battery settings
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            } else {
                // Fallback to app settings
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            }
            
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            // Fallback to app settings if specific settings not found
            try {
                Intent fallbackIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallbackIntent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(fallbackIntent);
                promise.resolve(true);
            } catch (Exception e2) {
                promise.reject("ERROR", e2.getMessage());
            }
        }
    }

    /**
     * Open battery optimization settings to disable battery optimization for the app
     */
    @ReactMethod
    public void openBatterySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            // Fallback to general battery settings
            try {
                Intent fallbackIntent = new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS);
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(fallbackIntent);
                promise.resolve(true);
            } catch (Exception e2) {
                promise.reject("ERROR", e2.getMessage());
            }
        }
    }

    /**
     * Check if the device is a Chinese ROM (MIUI, ColorOS, etc.) that blocks background services
     */
    @ReactMethod
    public void isMiuiDevice(Promise promise) {
        String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
        boolean isMiui = manufacturer.contains("xiaomi") || 
                         manufacturer.contains("redmi") || 
                         manufacturer.contains("poco") ||
                         manufacturer.contains("oppo") ||
                         manufacturer.contains("vivo") ||
                         manufacturer.contains("huawei") ||
                         manufacturer.contains("honor");
        promise.resolve(isMiui);
    }
}

