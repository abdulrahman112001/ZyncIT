import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import { User } from '../types';
import { COLLECTIONS } from '../constants';
import { NativeCredentialsService } from '../services/nativeCredentials';
import {
  AppError,
  parseFirebaseAuthError,
  ErrorCode,
  logError,
} from '../utils/errors';
import { authLogger as logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Configure Google Sign In - Client ID from .env
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: () => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        try {
          // Create or update user document using set with merge
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          };

          // Use set with merge to create or update
          await firestore()
            .collection(COLLECTIONS.USERS)
            .doc(firebaseUser.uid)
            .set(userData, { merge: true });

          set({
            user: userData,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('[AuthStore] Error in onAuthStateChanged:', error);
          // Even if Firestore fails, we should still authenticate the user
          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            } as User,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } else {
        set({
          user: null,
          firebaseUser: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      logger.info(`Signing in user: ${email}`);
      await auth().signInWithEmailAndPassword(email, password);
      logger.info('Sign in successful');
    } catch (error: any) {
      const appError = parseFirebaseAuthError(error);
      logError(appError, 'signInWithEmail');
      set({ error: appError.getLocalizedMessage('en'), isLoading: false });
      throw appError;
    }
  },

  signUpWithEmail: async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      logger.info(`Creating new user: ${email}`);
      const result = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      await result.user.updateProfile({ displayName });

      // Create user document with photoURL
      const userData: User = {
        uid: result.user.uid,
        email: email,
        displayName: displayName,
        photoURL: result.user.photoURL || null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(result.user.uid)
        .set(userData);

      logger.info('User created successfully');
    } catch (error: any) {
      const appError = parseFirebaseAuthError(error);
      logError(appError, 'signUpWithEmail');
      set({ error: appError.getLocalizedMessage('en'), isLoading: false });
      throw appError;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      console.log(
        '[AuthStore] Google signIn result:',
        JSON.stringify(signInResult, null, 2),
      );

      // Check if sign in was successful (v16.x returns { type: 'success', data: {...} })
      if (!signInResult || signInResult.type === 'cancelled') {
        throw new Error('Google Sign-In was cancelled');
      }

      // Handle v16.x response format: { type: 'success', data: { idToken, user } }
      let idToken: string | null = null;
      let accessToken: string | null = null;
      let googleDisplayName: string | null = null;
      let googlePhotoURL: string | null = null;

      // Try different response formats
      if ('data' in signInResult && signInResult.data) {
        // v16.x format
        idToken = signInResult.data.idToken;
        googleDisplayName = signInResult.data.user?.name || null;
        googlePhotoURL = signInResult.data.user?.photo || null;
      } else if ('idToken' in signInResult) {
        // Older format
        idToken = (signInResult as any).idToken;
        googleDisplayName = (signInResult as any).user?.name || null;
        googlePhotoURL = (signInResult as any).user?.photo || null;
      }

      // If still no idToken, try getTokens()
      if (!idToken) {
        console.log(
          '[AuthStore] No idToken in signInResult, trying getTokens()...',
        );
        try {
          const tokens = await GoogleSignin.getTokens();
          console.log(
            '[AuthStore] getTokens result:',
            JSON.stringify(tokens, null, 2),
          );
          idToken = tokens.idToken;
          // If no idToken but have accessToken, use it
          if (!idToken && tokens.accessToken) {
            console.log('[AuthStore] Using accessToken instead of idToken');
            accessToken = tokens.accessToken;
          }
        } catch (tokenError) {
          console.log('[AuthStore] getTokens failed:', tokenError);
        }
      }

      // We can use either idToken or accessToken with Firebase
      if (!idToken && !accessToken) {
        throw new Error('No ID token or access token received from Google');
      }

  
      // Create a Google credential with the token
      // GoogleAuthProvider.credential(idToken, accessToken) - either can be null
      const googleCredential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken as string | undefined,
      );

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );

      // Create or update user document with photoURL
      const userData: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName:
          googleDisplayName || userCredential.user.displayName || 'User',
        photoURL: googlePhotoURL || userCredential.user.photoURL || null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userCredential.user.uid)
        .set(userData, { merge: true });

      // Note: isLoading will be set to false by onAuthStateChanged listener
      // But add a fallback in case it doesn't fire
      console.log(
        '[AuthStore] Google Sign-In successful, waiting for auth state change...',
      );
    } catch (error: any) {
      // Handle specific Google Sign-In errors
      const errorMessage =
        error?.message || error?.code || 'Google Sign-In failed';
      console.error('[AuthStore] Google Sign-In error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      // Clear native credentials for background operation
      try {
        await NativeCredentialsService.clearCredentials();
        console.log('[AuthStore] Native credentials cleared');
      } catch (e) {
        console.warn('[AuthStore] Failed to clear native credentials:', e);
      }

      // Sign out from Google if signed in with Google
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in with Google
      }

      // Clear all stores data before signing out
      const { useSMSStore } = require('./smsStore');
      const { useDeviceStore } = require('./deviceStore');
      const { useChatStore } = require('./chatStore');
      const { useCallStore } = require('./callStore');
      const { useNotificationStore } = require('./notificationStore');

      useSMSStore.getState().cleanup();
      useDeviceStore.getState().cleanup();
      useChatStore.getState().cleanup();
      useCallStore.getState().cleanup();
      useNotificationStore.getState().cleanup();

      console.log('[AuthStore] All stores cleaned up');

      await auth().signOut();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
