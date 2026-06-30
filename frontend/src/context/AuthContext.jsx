import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// If the verified Auth email differs from the stored profile email
// (e.g. after a confirmed email change), keep the Firestore doc in sync.
async function syncEmail(firebaseUser, data) {
  const authEmail = (firebaseUser.email || '').toLowerCase();
  if (authEmail && data?.email && data.email.toLowerCase() !== authEmail) {
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { email: authEmail });
      return { ...data, email: authEmail };
    } catch { /* rules may block until verified; ignore */ }
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(null); // { email, password }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = await syncEmail(firebaseUser, snap.data());
          setUser({ id: firebaseUser.uid, emailVerified: firebaseUser.emailVerified, ...data });
        } else {
          setUser(null);
        }
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
    const data = await syncEmail(cred.user, snap.data());
    setUser({ id: cred.user.uid, emailVerified: true, ...data });
  };

  const register = async (name, email, password, university) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email: email.toLowerCase(),
      university: university || '',
      bio: '',
      phone: '',
      bookmarks: [],
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user);
    await signOut(auth);
    setPendingVerification({ email: email.toLowerCase(), password });
  };

  // Sign in / sign up with Google or Facebook. Social accounts are
  // provider-verified, so they skip the email-verification step.
  const socialLogin = async (providerName) => {
    const provider = providerName === 'facebook' ? new FacebookAuthProvider() : new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const fbUser = cred.user;
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const newData = {
        name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'New user'),
        email: (fbUser.email || '').toLowerCase(),
        university: '', bio: '', phone: '', bookmarks: [], createdAt: serverTimestamp(),
      };
      await setDoc(ref, newData);
      setUser({ id: fbUser.uid, emailVerified: true, ...newData });
    } else {
      const data = await syncEmail(fbUser, snap.data());
      setUser({ id: fbUser.uid, emailVerified: true, ...data });
    }
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

  // Toggle a listing in the user's bookmarks (optimistic local update).
  const toggleBookmark = async (listingId) => {
    if (!auth.currentUser || !user) return;
    const has = (user.bookmarks || []).includes(listingId);
    const next = has
      ? (user.bookmarks || []).filter(id => id !== listingId)
      : [...(user.bookmarks || []), listingId];
    setUser(u => ({ ...u, bookmarks: next }));
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        bookmarks: has ? arrayRemove(listingId) : arrayUnion(listingId),
      });
    } catch {
      setUser(u => ({ ...u, bookmarks: user.bookmarks || [] })); // revert on failure
    }
  };

  // Change email securely: re-authenticate, then send a verification link to the
  // NEW address. The email only switches once the user clicks that link.
  const changeEmail = async (newEmail, currentPassword) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim().toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, resendVerification, pendingVerification, toggleBookmark, changeEmail, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
