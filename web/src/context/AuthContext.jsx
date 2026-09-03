import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

async function readProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async user => {
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
    const studentNumber = form.studentNumber.trim().toUpperCase();
    const fullname = form.fullname.trim();
    const course = 'BSIT';
    const yearLevel = String(form.yearLevel || '').trim();
    const section = String(form.section || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    const validYears = ['1st', '2nd', '3rd', '4th'];
    if (!validYears.includes(yearLevel)) throw new Error('Choose a valid year level.');
    if (!section) throw new Error('Enter a section using 1 to 3 letters or numbers.');

    const duplicate = await getDocs(query(collection(db, 'users'), where('studentNumber', '==', studentNumber)));
    if (!duplicate.empty) throw new Error('Student ID is already registered.');

    const credential = await createUserWithEmailAndPassword(auth, email, form.password);
    const uid = credential.user.uid;
    try {
      const classGroupId = `SECTION_${course}_${section}`;
      const groupRef = doc(db, 'classGroups', classGroupId);
      const groupSnap = await getDoc(groupRef);
      const years = groupSnap.exists() && Array.isArray(groupSnap.data().yearLevels) ? groupSnap.data().yearLevels : [];
      if (!years.includes(yearLevel)) years.push(yearLevel);
      await setDoc(groupRef, {
        course, section, name: `Section ${section}`, yearLevels: years,
        status: 'active', updatedAt: serverTimestamp(), ...(groupSnap.exists() ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });
      await setDoc(doc(db, 'users', uid), {
        uid, fullname, studentNumber, email, yearLevel, course, section, classGroupId,
        role: 'student', status: 'active', profileImage: '', department: '',
        createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
      });
      const data = await readProfile(uid); setProfile(data); return data;
    } catch (error) { await signOut(auth); throw error; }
  }

  const logout = () => signOut(auth);
  const resetPassword = email => sendPasswordResetEmail(auth, email.trim().toLowerCase());
  const refreshProfile = async () => { if (!auth.currentUser) return null; const data = await readProfile(auth.currentUser.uid); setProfile(data); return data; };
  const value = useMemo(() => ({ firebaseUser, profile, loading, login, logout, resetPassword, registerStudent, refreshProfile }), [firebaseUser, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const roleHome = role => role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
