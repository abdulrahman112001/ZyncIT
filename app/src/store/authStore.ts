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
          // Get or create user document
          const userDoc = await firestore()
            .collection(COLLECTIONS.USERS)
            .doc(firebaseUser.uid)
            .get();

          let userData: User;

          if (userDoc.exists) {
            userData = userDoc.data() as User;
            // Update last login
            await firestore()
              .collection(COLLECTIONS.USERS)
              .doc(firebaseUser.uid)
              .update({ lastLoginAt: Date.now() });
          } else {
            // Create new user document
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            };
            await firestore()
              .collection(COLLECTIONS.USERS)
              .doc(firebaseUser.uid)
              .set(userData);
          }

          set({
            user: userData,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
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

      // Create user document
      const userData: User = {
        uid: result.user.uid,
        email: email,
        displayName: displayName,
        photoURL: null,
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
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
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

      await auth().signOut();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
