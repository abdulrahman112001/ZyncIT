package com.IRopit;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = UserCredentialsModule.NAME)
public class UserCredentialsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "UserCredentialsModule";
    private final ReactApplicationContext reactContext;
    private final FirebaseHelper firebaseHelper;

    public UserCredentialsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.firebaseHelper = FirebaseHelper.getInstance(context);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void saveCredentials(String userId, String deviceId, Promise promise) {
        try {
            firebaseHelper.saveUserCredentials(userId, deviceId);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void clearCredentials(Promise promise) {
        try {
            firebaseHelper.clearUserCredentials();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getUserId(Promise promise) {
        try {
            String userId = firebaseHelper.getUserId();
            promise.resolve(userId);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        try {
            String deviceId = firebaseHelper.getDeviceId();
            promise.resolve(deviceId);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isLoggedIn(Promise promise) {
        try {
            boolean loggedIn = firebaseHelper.isLoggedIn();
            promise.resolve(loggedIn);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void saveDeviceName(String deviceName, Promise promise) {
        try {
            firebaseHelper.saveDeviceName(deviceName);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getDeviceName(Promise promise) {
        try {
            String deviceName = firebaseHelper.getDeviceName();
            promise.resolve(deviceName);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}

