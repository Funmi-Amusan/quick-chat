import { User, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { auth } from 'lib/firebase-config';
import { login, logout, register } from 'lib/firebase-sevice';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<User | undefined>;
  signUp: (email: string, password: string, name?: string) => Promise<User | undefined>;
  signOut: () => void;
  user: User | null;
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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await login(email, password);
      return response?.user;
    } catch (error) {
      console.error('[handleSignIn error] ==>', error);
      return undefined;
    }
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await register(email, password, name);
      if (response?.user) {
        console.log('User created successfully, UID:', response.user.uid); // Add log
        const db = getDatabase();
        const userRef = ref(db, 'users/' + response.user.uid);
        console.log('Attempting to write to RTDB path:', userRef.toString()); // Add log
        console.log('Data to write:', { username: name, email }); // Add log

        set(userRef, {
          username: name,
          email,
        })
          .then(() => {
            console.log('Data successfully written to RTDB!'); // Add success log
          })
          .catch((error) => {
            console.error('Error writing data to RTDB:', error); // Add specific DB error log
          });
      } else {
        console.log('Registration response did not contain a user object.'); // Add log
      }
      return response?.user;
    } catch (error) {
      console.error('[handleSignUp error] ==>', error);
      return undefined;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
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
        isLoading,
      }}>
      {props.children}
    </AuthContext.Provider>
  );
}
