import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// Firebase configuration
// Note: For React Native, Firebase uses google-services.json (Android)
// and GoogleService-Info.plist (iOS) for auto-configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDVRdXSxo3MlWXCuCtUUaqVDa8-0ypQBv8',
  authDomain: 'zyncit-f1ced.firebaseapp.com',
  projectId: 'zyncit-f1ced',
  storageBucket: 'zyncit-f1ced.firebasestorage.app',
  messagingSenderId: '772958487002',
  appId: '1:772958487002:web:c2dcb8043d3bfed2ec40e3',
};

export const initializeFirebase = () => {
  if (!firebase.apps.length) {
    // Firebase is auto-initialized with google-services.json
    console.log('Firebase initialized');
  }
};

export { auth, firestore, messaging };
export default firebase;
