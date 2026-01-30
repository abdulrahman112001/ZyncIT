/**
 * iRopit Services - Main Export
 */

// API Service
export { default as ApiService } from './api';
export type { HttpMethod, RequestConfig, ApiResponse } from './api';

// Firebase Service
export { default as FirebaseService } from './firebase';

// SMS Service
export { default as SmsService } from './sms';

// Call Service
export { default as CallService } from './call';

// Chat Service
export { default as ChatService } from './chat';

// Navigation Service
export {
  navigationRef,
  navigate,
  navigateAndReset,
  goBack,
  push,
  pop,
  popToTop,
  replace,
  reset,
  getCurrentRouteName,
  setParams,
  isReady,
  addReadyListener,
  default as NavigationService,
} from './NavigationService';
