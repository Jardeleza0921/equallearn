import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleAuthProvider, confirmPasswordReset, createUserWithEmailAndPassword, deleteUser,
  onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { fullNameFromParts, normalizeCourse, normalizeMiddleInitial, normalizePersonName, splitFullName } from '../lib/data';

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

async function readProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Firebase Authentication keeps emails unique, so the only account-level
// duplicate that can be rejected is the email. Student numbers and profile
// details are allowed to match another student's record.
function registrationErrorMessage(error) {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') return 'This email is already registered. Sign in instead, or register with a different email address.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address, for example name@school.edu.ph.';
  if (code === 'auth/weak-password') return 'Choose a password with at least 6 characters.';
  if (code === 'auth/operation-not-allowed') return 'Email and password registration is not enabled for this Firebase project.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes, then try again.';
  if (code === 'auth/network-request-failed') return 'Network problem. Check your connection and try again.';
  return error?.message || 'Unable to create the account.';
}

function googleErrorMessage(error) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') return '';
  if (code === 'auth/popup-blocked') return 'The Google window was blocked. Allow pop-ups for EqualLearn, then try again.';
  if (code === 'auth/account-exists-with-different-credential') return 'This email already signs in with a password. Sign in with your password instead.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this Firebase project yet.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized for Google sign-in in Firebase Authentication.';
  if (code === 'auth/network-request-failed') return 'Network problem. Check your connection and try again.';
  return error?.message || 'Google sign-in could not be completed.';
}

function profileSaveReason(error) {
  const code = error?.code || '';
  if (code === 'permission-denied') return 'The database rejected the profile save (missing or insufficient permissions).';
  if (code === 'unavailable') return 'The database was unreachable.';
  return 'The profile could not be saved.';
}

// Firebase sends the reset link itself. The continue URL brings the student
// back to EqualLearn once the password has been changed.
function resetActionCodeSettings() {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://equallearn.netlify.app';
  return { url: `${origin}/login?reset=done`, handleCodeInApp: false };
}

function studentDetails(form) {
  const firstName = normalizePersonName(form.firstName);
  const middleInitial = normalizeMiddleInitial(form.middleInitial);
  const lastName = normalizePersonName(form.lastName);
  if (!firstName) throw new Error('Enter your first name.');
  if (!lastName) throw new Error('Enter your last name.');
  const fullname = fullNameFromParts({ firstName, middleInitial, lastName });
  const studentNumber = String(form.studentNumber || '').trim().toUpperCase();
  if (!studentNumber) throw new Error('Enter your student number.');
  const course = normalizeCourse(form.course);
  if (!course) throw new Error('Enter your course, for example BSIT.');
  const yearLevel = String(form.yearLevel || '').trim();
  if (!['1st', '2nd', '3rd', '4th'].includes(yearLevel)) throw new Error('Choose a valid year level.');
  const section = String(form.section || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  if (!section) throw new Error('Enter a section using 1 to 3 letters or numbers.');
  return { firstName, middleInitial, lastName, fullname, studentNumber, course, yearLevel, section };
}

// Section grouping is bookkeeping: a student registration must still succeed
// when this optional write is refused.
async function updateSectionGroup({ course, section, yearLevel }) {
  try {
    const groupRef = doc(db, 'classGroups', `SECTION_${course}_${section}`);
    const groupSnap = await getDoc(groupRef);
    const years = groupSnap.exists() && Array.isArray(groupSnap.data().yearLevels) ? [...groupSnap.data().yearLevels] : [];
    if (!years.includes(yearLevel)) years.push(yearLevel);
    await setDoc(groupRef, {
      course, section, name: `Section ${section}`, yearLevels: years,
      status: 'active', updatedAt: serverTimestamp(), ...(groupSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
  } catch (error) {
    console.warn('EqualLearn class group update skipped:', error);
  }
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAccount, setGoogleAccount] = useState(null);
  const registrationInFlight = useRef(false);
  const googleFlow = useRef(false);

  useEffect(() => onAuthStateChanged(auth, async user => {
    if (user && (registrationInFlight.current || googleFlow.current)) {
      // A registration or Google sign-up is in progress. The sign-in account
      // exists a moment before users/{uid} is written, so the new profile can
      // still be missing here. Those flows apply the saved profile themselves;
      // signing out from this listener would cancel the save and strand the
      // new account.
      return;
    }
    setLoading(true);
    if (!user) {
      setFirebaseUser(null); setProfile(null); setLoading(false); return;
    }
    try {
      const data = await readProfile(user.uid);
      if (!data || (data.status || '').toLowerCase() === 'inactive') {
        await signOut(auth); setFirebaseUser(null); setProfile(null);
      } else {
        setFirebaseUser(user); setProfile(data);
      }
    } catch (error) {
      console.error('EqualLearn auth profile error:', error);
      setFirebaseUser(user); setProfile(null);
    } finally { setLoading(false); }
  }), []);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const data = await readProfile(credential.user.uid);
    if (!data) { await signOut(auth); throw new Error('No matching EqualLearn user profile was found.'); }
    if (!data.role) { await signOut(auth); throw new Error('This account has no assigned role.'); }
    if ((data.status || '').toLowerCase() === 'inactive') { await signOut(auth); throw new Error('This account is inactive.'); }
    try { await updateDoc(doc(db, 'users', credential.user.uid), { lastLogin: serverTimestamp() }); } catch (e) { console.warn('lastLogin update skipped:', e); }
    setProfile(data);
    return data;
  }

  async function registerStudent(form) {
    const email = form.email.trim().toLowerCase();
    const details = studentDetails(form);

    // No student-number duplicate check: two students may share a number, and
    // no name, course, year level, or section is compared against other
    // records. Nothing is read from Firestore before the account exists, which
    // is what used to fail with "Missing or insufficient permissions".

    registrationInFlight.current = true;
    try {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(auth, email, form.password);
      } catch (error) {
        throw new Error(registrationErrorMessage(error));
      }

      const uid = credential.user.uid;
      const classGroupId = `SECTION_${details.course}_${details.section}`;

      await updateSectionGroup(details);

      const profileFields = {
        uid, ...details, email, classGroupId,
        role: 'student', status: 'active', profileImage: '', department: '', authProvider: 'password',
      };

      try {
        await setDoc(doc(db, 'users', uid), { ...profileFields, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
      } catch (error) {
        console.error('EqualLearn student profile save error:', error);
        const reason = profileSaveReason(error);
        let rolledBack = false;
        try {
          // Remove the sign-in account so the email is still usable and no
          // half-registered account is left behind.
          await deleteUser(credential.user);
          rolledBack = true;
        } catch (rollbackError) {
          console.error('EqualLearn registration rollback error:', rollbackError);
          try { await signOut(auth); } catch (signOutError) { console.error('EqualLearn sign-out error:', signOutError); }
        }
        throw new Error(rolledBack
          ? `We could not save your student profile, so the new sign-in account was removed. ${reason} Please try again.`
          : `Your sign-in account was created, but your student profile could not be saved. ${reason} Contact an administrator with your email address (${email}) before signing in again.`);
      }

      const stored = await readProfile(uid).catch(error => {
        console.warn('EqualLearn profile read-back skipped:', error);
        return null;
      });
      const data = stored || { id: uid, ...profileFields, createdAt: null, lastLogin: null };
      setFirebaseUser(credential.user);
      setProfile(data);
      return data;
    } finally {
      registrationInFlight.current = false;
    }
  }

  // Google sign-in. An existing EqualLearn profile signs the student straight
  // in. When allowProfileSetup is true and the Google account has no profile
  // yet, the session is kept so the student can finish registering; otherwise
  // the session is closed and the caller is told a profile is required.
  async function signInWithGoogle({ allowProfileSetup = false } = {}) {
    googleFlow.current = true;

    let credential;
    try {
      credential = await signInWithPopup(auth, googleProvider);
    } catch (error) {
      googleFlow.current = false;
      const message = googleErrorMessage(error);
      if (!message) return { status: 'cancelled' };
      throw new Error(message);
    }

    const user = credential.user;
    let data = null;
    let readError = null;
    try { data = await readProfile(user.uid); } catch (error) { readError = error; }

    if (readError) {
      console.error('EqualLearn Google profile error:', readError);
      googleFlow.current = false;
      try { await signOut(auth); } catch (error) { console.warn('Google sign-out skipped:', error); }
      throw new Error('We could not read your EqualLearn profile. Check your connection and try again.');
    }

    if (data && (data.status || '').toLowerCase() === 'inactive') {
      googleFlow.current = false;
      await signOut(auth);
      throw new Error('This account is inactive.');
    }

    if (data) {
      googleFlow.current = false;
      setFirebaseUser(user);
      setProfile(data);
      try { await updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }); } catch (error) { console.warn('lastLogin update skipped:', error); }
      return { status: 'signed-in', profile: data };
    }

    const parts = splitFullName(user.displayName || '');
    const account = {
      uid: user.uid,
      email: (user.email || '').toLowerCase(),
      firstName: parts.firstName || '',
      middleInitial: parts.middleInitial || '',
      lastName: parts.lastName || '',
      fullname: fullNameFromParts(parts) || user.displayName || '',
      photoURL: user.photoURL || '',
    };

    if (!allowProfileSetup) {
      googleFlow.current = false;
      try { await signOut(auth); } catch (error) { console.warn('Google sign-out skipped:', error); }
      return { status: 'needs-profile', account };
    }

    setGoogleAccount(account);
    return { status: 'needs-profile', account };
  }

  async function completeGoogleRegistration(form) {
    const user = auth.currentUser;
    if (!user || !googleFlow.current) throw new Error('Sign in with Google again to finish creating your account.');

    const details = studentDetails(form);
    const uid = user.uid;
    const email = (user.email || form.email || '').trim().toLowerCase();
    if (!email) throw new Error('Your Google account did not share an email address. Use student registration instead.');

    const existing = await readProfile(uid).catch(error => {
      console.warn('EqualLearn profile check skipped:', error);
      return null;
    });
    if (existing) {
      googleFlow.current = false;
      setGoogleAccount(null);
      setFirebaseUser(user);
      setProfile(existing);
      return existing;
    }

    const classGroupId = `SECTION_${details.course}_${details.section}`;
    await updateSectionGroup(details);

    const profileFields = {
      uid, ...details, email, classGroupId,
      role: 'student', status: 'active', profileImage: user.photoURL || '', department: '', authProvider: 'google',
    };

    try {
      await setDoc(doc(db, 'users', uid), { ...profileFields, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
    } catch (error) {
      console.error('EqualLearn Google profile save error:', error);
      googleFlow.current = false;
      setGoogleAccount(null);
      try { await signOut(auth); } catch (signOutError) { console.error('EqualLearn sign-out error:', signOutError); }
      throw new Error(`We could not save your student profile. ${profileSaveReason(error)} Please try again.`);
    }

    const stored = await readProfile(uid).catch(error => {
      console.warn('EqualLearn profile read-back skipped:', error);
      return null;
    });
    const data = stored || { id: uid, ...profileFields, createdAt: null, lastLogin: null };
    googleFlow.current = false;
    setGoogleAccount(null);
    setFirebaseUser(user);
    setProfile(data);
    return data;
  }

  async function cancelGoogleSetup() {
    googleFlow.current = false;
    setGoogleAccount(null);
    if (auth.currentUser) {
      try { await signOut(auth); } catch (error) { console.warn('Google cancel sign-out skipped:', error); }
    }
  }

  const logout = () => signOut(auth);

  // Firebase emails the reset link. The continue URL is optional: if the
  // project has not authorized this domain yet, fall back to the default link
  // so password recovery keeps working.
  async function resetPassword(email) {
    const target = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, target, resetActionCodeSettings());
    } catch (error) {
      const code = error?.code || '';
      if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        return sendPasswordResetEmail(auth, target);
      }
      throw error;
    }
  }

  // Used by the in-app reset page when the Firebase email template points at
  // EqualLearn's own /reset-password screen.
  const completePasswordReset = (code, password) => confirmPasswordReset(auth, code, password);

  const refreshProfile = async () => { if (!auth.currentUser) return null; const data = await readProfile(auth.currentUser.uid); setProfile(data); return data; };
  const value = useMemo(() => ({
    firebaseUser, profile, loading, googleAccount,
    login, logout, resetPassword, registerStudent, refreshProfile,
    signInWithGoogle, completeGoogleRegistration, cancelGoogleSetup, completePasswordReset,
  }), [firebaseUser, profile, loading, googleAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const roleHome = role => role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
