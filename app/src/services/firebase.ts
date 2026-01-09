import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import Config from 'react-native-config';

// Firebase configuration from .env file
// Note: For React Native, Firebase also uses google-services.json (Android)
// and GoogleService-Info.plist (iOS) for auto-configuration
const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY || 'AIzaSyDVRdXSxo3MlWXCuCtUUaqVDa8-0ypQBv8',
  authDomain: Config.FIREBASE_AUTH_DOMAIN || 'zyncit-f1ced.firebaseapp.com',
  projectId: Config.FIREBASE_PROJECT_ID || 'zyncit-f1ced',
  storageBucket:
    Config.FIREBASE_STORAGE_BUCKET || 'zyncit-f1ced.firebasestorage.app',
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '772958487002',
  appId: Config.FIREBASE_APP_ID || '1:772958487002:web:c2dcb8043d3bfed2ec40e3',
};

export const initializeFirebase = () => {
  if (!firebase.apps.length) {
    // Firebase is auto-initialized with google-services.json
    console.log('Firebase initialized');
  }
};

export { auth, firestore, messaging };
export default firebase;
