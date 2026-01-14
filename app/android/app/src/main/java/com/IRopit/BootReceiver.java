package com.IRopit;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver - Starts background services when device boots up
 * This ensures notifications, SMS, and calls sync even after phone restarts
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "IRopit_BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.i(TAG, "BootReceiver triggered: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)) {
            
            Log.i(TAG, "Device booted or app updated - initializing services");
            
            // The NotificationService is a NotificationListenerService
            // It will be started automatically by the system when it has permission
            // We just need to request a rebind to ensure it connects
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    android.content.ComponentName componentName = new android.content.ComponentName(
                        context.getPackageName(),
                        NotificationService.class.getName()
                    );
                    android.service.notification.NotificationListenerService.requestRebind(componentName);
                    Log.i(TAG, "Requested NotificationService rebind on boot");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error requesting NotificationService rebind: " + e.getMessage());
            }
            
            // Initialize Firebase to ensure connection is ready
            try {
                FirebaseHelper.getInstance(context);
                Log.i(TAG, "FirebaseHelper initialized on boot");
            } catch (Exception e) {
                Log.e(TAG, "Error initializing FirebaseHelper: " + e.getMessage());
            }
        }
    }
}
