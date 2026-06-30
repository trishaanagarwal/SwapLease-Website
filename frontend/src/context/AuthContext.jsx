import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

const makeProvider = (name) => (name === 'facebook' ? new FacebookAuthProvider() : new GoogleAuthProvider());

// Ensure a Firestore profile exists for a federated (Google/Facebook) user.
async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const newData = {
    name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'New user'),
    email: (firebaseUser.email || '').toLowerCase(),
    university: '', bio: '', phone: '', bookmarks: [], createdAt: serverTimestamp(),
  };
  await setDoc(ref, newData);
  return newData;
}

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
    // Complete any pending redirect-based social sign-in (popup fallback).
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        // Auto-create a profile for federated sign-ins (Google) on first login.
        if (!snap.exists()) {
          const isFederated = firebaseUser.providerData.some(p => p.providerId !== 'password');
          if (isFederated) {
            await ensureUserDoc(firebaseUser);
            snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          }
        }
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

  // Sign in / sign up with Google (or Facebook). Social accounts are
  // provider-verified, so they skip the email-verification step.
  const socialLogin = async (providerName) => {
    const cred = await signInWithPopup(auth, makeProvider(providerName));
    const data = await ensureUserDoc(cred.user);
    const synced = await syncEmail(cred.user, data);
    setUser({ id: cred.user.uid, emailVerified: true, ...synced });
  };

  // Fallback for browsers that block popups (e.g. Brave/Safari with strict shields).
  const socialLoginRedirect = (providerName) => signInWithRedirect(auth, makeProvider(providerName));

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

  // Send a password-reset email (for users who forgot their password).
  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim().toLowerCase());

  // True if the signed-in account uses email/password (vs Google).
  const isPasswordUser = () =>
    !!auth.currentUser?.providerData?.some(p => p.providerId === 'password');

  // Permanently delete the account: re-authenticate, remove the user's listings
  // and profile, then delete the Auth account. Requires a recent login.
  const deleteAccount = async (password) => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not signed in.');
    const providerId = u.providerData[0]?.providerId || 'password';
    // Step 1 — verify identity (re-authenticate).
    if (providerId === 'password') {
      const cred = EmailAuthProvider.credential(u.email, password);
      await reauthenticateWithCredential(u, cred);
    } else {
      await reauthenticateWithPopup(u, makeProvider(providerId.includes('facebook') ? 'facebook' : 'google'));
    }
    // Step 2 — delete the user's own listings.
    const snap = await getDocs(query(collection(db, 'listings'), where('userId', '==', u.uid)));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    // Step 3 — delete the profile doc, then the Auth account.
    await deleteDoc(doc(db, 'users', u.uid));
    await deleteUser(u);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, resendVerification, pendingVerification, toggleBookmark, changeEmail, socialLogin, socialLoginRedirect, resetPassword, deleteAccount, isPasswordUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
