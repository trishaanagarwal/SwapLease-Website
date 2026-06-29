import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(null); // { email, password }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser(snap.exists() ? { id: firebaseUser.uid, emailVerified: firebaseUser.emailVerified, ...snap.data() } : null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      const err = new Error('Please verify your email before logging in.');
      err.needsVerification = true;
      throw err;
    }
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    setUser({ id: cred.user.uid, emailVerified: true, ...snap.data() });
  };

  const register = async (name, email, password, university) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email: email.toLowerCase(),
      university: university || '',
      bio: '',
      phone: '',
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user);
    await signOut(auth);
    setPendingVerification({ email: email.toLowerCase(), password });
  };

  const resendVerification = async () => {
    if (!pendingVerification) return;
    const cred = await signInWithEmailAndPassword(auth, pendingVerification.email, pendingVerification.password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const logout = () => signOut(auth);

  const updateUser = (updates) => {
    setUser(u => ({ ...u, ...updates }));
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), updates).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, resendVerification, pendingVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
