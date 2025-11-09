import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';

import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set token with expiration
  const setWithExpiry = (key, value, ttl) => {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  };

  // Get token with expiration check
  const getWithExpiry = (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    // Compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete it from storage and return null
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  };

  // Clear user data from localStorage
  const clearUserData = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Check for existing session on app load
  useEffect(() => {
    const storedUser = getWithExpiry('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {        
        try {
          // First, try to get the user's role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userRole = 'user'; // Default role
          
          if (userDoc.exists()) {
            // If user exists in Firestore, use their stored role
            userRole = userDoc.data().role || 'user';
          } else {
            // If user doesn't exist in Firestore, create a new document
            // This is useful for users who sign in for the first time
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              status: 0, // Active by default
              uid: firebaseUser.uid,
            });
          }
          
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'User',
            role: userRole,
            lastLogin: new Date().toISOString()
          };

          // Set user in state and localStorage with 24-hour expiration
          setUser(userData);
          setWithExpiry('user', JSON.stringify(userData), 24 * 60 * 60 * 1000); // 24 hours
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to default role if there's an error
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'User',
            role: 'user',
            lastLogin: new Date().toISOString()
          };
          setUser(userData);
          // setWithExpiry('user', JSON.stringify(userData), 24 * 60 * 60 * 1000);
        }
      } else {
        // User is signed out
        clearUserData();
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userRole = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        role: userRole
      };
      
      // Redirect based on role
      if (userRole === 'admin' || userRole === 'manager') {
        window.location.href = '/admin';
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to log in';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Prepare user data for Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL,
          role: 'user',
          status: 0, // Mark as active for social login
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Store or update user data in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });
      }
     
      // Update local state with user data
      const userState = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        role: userDoc.exists() ? (userDoc.data().role || 'user') : 'user',
        status: 0
      };
      
      setUser(userState);
      localStorage.setItem('user', JSON.stringify(userState));
      return { success: true, user: userState };
    } catch (error) {
      console.error('Google Sign In Error:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithFacebook = useCallback(async () => {
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      // Add Facebook scopes
      provider.addScope('public_profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Prepare user data for Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL,
        role: 'user',
        status: 0, // Mark as active for social login
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Store or update user data in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });
      
      // Update local state with user data
      const userState = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'User',
        role: 'user',
        status: 0
      };
      
      setUser(userState);
      localStorage.setItem('user', JSON.stringify(userState));
      return { success: true, user: userState };
    } catch (error) {
      console.error('Facebook Sign In Error:', error);
      let errorMessage = 'Failed to sign in with Facebook';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email but different sign-in credentials';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update user profile with display name
      await updateProfile(firebaseUser, {
        displayName: name
      });
      
      // Prepare user data for Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name,
        role: 'user', // Default role is user
        status: 0,    // Default status is 0 (inactive/unverified)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false
      };

      // Store user data in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Update local state with user data
      const userState = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name,
        role: 'user',
        status: 0
      };
      
      setUser(userState);
      localStorage.setItem('user', JSON.stringify(userState));
      return { success: true, user: userState };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out');
      return { success: false, error: 'Failed to log out' };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setError,
    signInWithGoogle,
    signInWithFacebook
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Export the auth instance in case it's needed elsewhere
export { auth };

export const useAuth = () => {
  const context = useContext(AuthContext);  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
