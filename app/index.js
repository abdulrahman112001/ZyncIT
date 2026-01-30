import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './src/App';
import { name as appName } from './app.json';

// Handle background/quit state messages (FCM Push Notifications)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] Background message received:', remoteMessage);
  // The notification will be shown automatically by FCM
  // This handler is for data processing if needed
});

AppRegistry.registerComponent(appName, () => App);
