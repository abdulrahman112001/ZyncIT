/**
 * AuthContext
 * Authentication state management context
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Storage keys
const AUTH_STORAGE_KEY = '@iropit_auth_user';

// Default state
const defaultState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to convert Firebase user to our User type
const mapFirebaseUser = (
  firebaseUser: FirebaseAuthTypes.User | null,
): User | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber,
  };
};

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(defaultState);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      const user = mapFirebaseUser(firebaseUser);

      if (user) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }

      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  // Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Sign Up
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const { user } = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );

        if (displayName && user) {
          await user.updateProfile({ displayName });
        }
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.code);
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Sign Out
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await auth().signOut();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await auth().sendPasswordResetEmail(email);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Update Profile
  const updateProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const currentUser = auth().currentUser;
        if (!currentUser) throw new Error('No authenticated user');

        await currentUser.updateProfile(data);
        await currentUser.reload();

        const updatedUser = mapFirebaseUser(auth().currentUser);
        setState(prev => ({
          ...prev,
          user: updatedUser,
          isLoading: false,
        }));
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update profile';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }
    },
    [],
  );

  // Update Email
  const updateEmail = useCallback(async (newEmail: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      await currentUser.updateEmail(newEmail);
      await currentUser.reload();

      const updatedUser = mapFirebaseUser(auth().currentUser);
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Update Password
  const updatePassword = useCallback(async (newPassword: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      await currentUser.updatePassword(newPassword);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Delete Account
  const deleteAccount = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      await currentUser.delete();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh User
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.reload();
        const updatedUser = mapFirebaseUser(auth().currentUser);
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Clear Error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoized context value
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      updateEmail,
      updatePassword,
      deleteAccount,
      refreshUser,
      clearError,
    }),
    [
      state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      updateEmail,
      updatePassword,
      deleteAccount,
      refreshUser,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Helper function to get user-friendly error messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'البريد الإلكتروني غير صالح',
    'auth/user-disabled': 'تم تعطيل هذا الحساب',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
    'auth/weak-password': 'كلمة المرور ضعيفة جداً',
    'auth/operation-not-allowed': 'هذه العملية غير مسموحة',
    'auth/too-many-requests': 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً',
    'auth/network-request-failed': 'فشل الاتصال بالشبكة',
    'auth/requires-recent-login': 'يرجى تسجيل الدخول مرة أخرى',
    'auth/invalid-credential': 'بيانات الاعتماد غير صالحة',
  };

  return errorMessages[errorCode] || 'حدث خطأ غير متوقع';
};

export default AuthContext;
