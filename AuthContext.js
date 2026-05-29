// AuthContext.js
// Place this file at the ROOT of your project (same level as App.js)
// Provides the logged-in user + their Firestore profile to ALL pages.

import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // Firebase Auth user
  const [profile, setProfile] = useState(null);   // Firestore users doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await firestore().collection('users').doc(firebaseUser.uid).get();
        setProfile(snap.exists ? snap.data() : null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use anywhere: const { user, profile } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}