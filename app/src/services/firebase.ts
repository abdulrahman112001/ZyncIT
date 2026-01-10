import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import Config from 'react-native-config';

/**
 * Firebase Configuration
 * All values MUST come from .env file - no hardcoded fallbacks for security
 * React Native Firebase also uses google-services.json (Android) and GoogleService-Info.plist (iOS)
 */
const validateConfig = () => {
  const requiredKeys = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
  ];

  const missing = requiredKeys.filter(key => !Config[key]);

  if (missing.length > 0 && __DEV__) {
    console.warn(
      `⚠️ Missing Firebase config keys: ${missing.join(', ')}\n` +
        'Please ensure .env file is properly configured.',
    );
  }
};

// Firebase config - values from .env only (no hardcoded fallbacks)
const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
};

export const initializeFirebase = () => {
  validateConfig();

  if (!firebase.apps.length) {
    // Firebase is auto-initialized with google-services.json
    console.log('✅ Firebase initialized');
  }
};

export { auth, firestore, messaging };
export default firebase;
