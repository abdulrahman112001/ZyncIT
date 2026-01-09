import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { User } from '../types';
import { COLLECTIONS } from '../constants';
import { NativeCredentialsService } from '../services/nativeCredentials';

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

// Configure Google Sign In
GoogleSignin.configure({
  webClientId:
    '772958487002-cs178nsvp3qh9bdl7qk7jmsvleesjcm7.apps.googleusercontent.com',
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
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signUpWithEmail: async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
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
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
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

      // Check if sign in was successful (v16.x returns { type: 'success', data: {...} })
      if (!signInResult || signInResult.type === 'cancelled') {
        throw new Error('Google Sign-In was cancelled');
      }

      // Handle v16.x response format: { type: 'success', data: { idToken, user } }
      let idToken: string | null = null;
      let googleDisplayName: string | null = null;
      let googlePhotoURL: string | null = null;

      if ('data' in signInResult && signInResult.data) {
        idToken = signInResult.data.idToken;
        googleDisplayName = signInResult.data.user?.name || null;
        googlePhotoURL = signInResult.data.user?.photo || null;
      }

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

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
