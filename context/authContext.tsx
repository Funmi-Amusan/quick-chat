import { useQueryClient } from '@tanstack/react-query';
import { User, onAuthStateChanged,  } from 'firebase/auth';
import { getDatabase, ref, set, update } from 'firebase/database';
import { auth } from 'lib/firebase-config';
import { login, logout, register } from 'lib/firebase-sevice';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<User | undefined>;
  signUp: (email: string, password: string, name?: string) => Promise<User | undefined>;
  signOut: () => void;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useSession(): AuthContextType {
  const value = useContext(AuthContext);

  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const db = getDatabase();
  const userRef = ref(db, `users/${user?.uid}`);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const status = {
          isLoggedIn: true,
        };
        update(userRef, status);
        setIsLoading(false);
      } else {
        setUser(null);
        const status = {
          isLoggedIn: true,
        };
        update(userRef, status);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await login(email, password);
      if (response?.user) {
        Toast.show({
          type: 'success',
          text1: 'Sign in successful',
          text2: 'You have successfully signed in.',
        });
        setIsAuthenticated(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign in failed',
          text2: 'Please check your email and password and try again.',
        });
      }
      return response?.user;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await register(email, password, name);
      if (response?.user) {
        const db = getDatabase();
        const userRef = ref(db, 'users/' + response.user.uid);
        set(userRef, {
          username: name,
          email,
        })
          .then(() => {})
          .catch((error) => {
            throw new Error('Error saving user data to database: ' + error);
          });
      } else {
        throw new Error('Registration failed. Please try again.');
      }
      return response?.user as User | undefined;
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUser(null);
      queryClient.clear()
    } catch (error) {
      console.error('[handleSignOut error] ==>', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        user,
        isAuthenticated,
        isLoading,
      }}>
      {props.children}
    </AuthContext.Provider>
  );
}
