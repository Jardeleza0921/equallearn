import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);
async function readProfile(uid) { const snap = await getDoc(doc(db, 'users', uid)); return snap.exists() ? { id: snap.id, ...snap.data() } : null; }

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile(uid = firebaseUser?.uid) { if (!uid) return null; const next = await readProfile(uid); setProfile(next); return next; }

  useEffect(() => onAuthStateChanged(auth, async user => {
    setLoading(true);
    if (!user) { setFirebaseUser(null); setProfile(null); setLoading(false); return; }
    try {
      const p = await readProfile(user.uid);
      if (!p || (p.status || '').toLowerCase() === 'inactive') { await signOut(auth); setFirebaseUser(null); setProfile(null); }
      else { setFirebaseUser(user); setProfile(p); }
    } catch (e) { console.error(e); setFirebaseUser(user); }
    finally { setLoading(false); }
  }), []);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const p = await readProfile(credential.user.uid);
    if (!p) { await signOut(auth); throw new Error('No matching EqualLearn user profile was found.'); }
    if (!p.role) { await signOut(auth); throw new Error('This account has no assigned role.'); }
    if ((p.status || '').toLowerCase() === 'inactive') { await signOut(auth); throw new Error('This account is inactive.'); }
    try { await updateDoc(doc(db, 'users', credential.user.uid), { lastLogin: serverTimestamp() }); } catch (e) { console.warn(e); }
    setFirebaseUser(credential.user); setProfile(p); return p;
  }

  async function registerStudent(form) {
    const email = form.email.trim().toLowerCase();
    const studentNumber = form.studentNumber.trim().toUpperCase();
    const fullname = form.fullname.trim();
    const course = 'BSIT';
    const yearLevel = String(form.yearLevel || '').trim();
    const section = String(form.section || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    if (!['1st','2nd','3rd','4th'].includes(yearLevel)) throw new Error('Choose a valid year level.');
    if (!section) throw new Error('Enter a section using 1 to 3 letters or numbers.');
    const duplicate = await getDocs(query(collection(db, 'users'), where('studentNumber', '==', studentNumber)));
    if (!duplicate.empty) throw new Error('Student ID is already registered.');
    const credential = await createUserWithEmailAndPassword(auth, email, form.password);
    const uid = credential.user.uid;
    try {
      const classGroupId = `SECTION_${course}_${section}`;
      const groupRef = doc(db, 'classGroups', classGroupId);
      const groupSnap = await getDoc(groupRef);
      const years = groupSnap.exists() && Array.isArray(groupSnap.data().yearLevels) ? [...groupSnap.data().yearLevels] : [];
      if (!years.includes(yearLevel)) years.push(yearLevel);
      await setDoc(groupRef, { course, section, name:`Section ${section}`, yearLevels:years, status:'active', updatedAt:serverTimestamp(), ...(groupSnap.exists()?{}:{createdAt:serverTimestamp()}) }, { merge:true });
      await setDoc(doc(db, 'users', uid), { uid, fullname, studentNumber, email, yearLevel, course, section, classGroupId, role:'student', status:'active', profileImage:'', department:'', phone:'', bio:'', createdAt:serverTimestamp(), lastLogin:serverTimestamp() });
      const p = await readProfile(uid); setFirebaseUser(credential.user); setProfile(p); return p;
    } catch (e) { await signOut(auth); throw e; }
  }

  const resetPassword = email => sendPasswordResetEmail(auth, email.trim().toLowerCase());
  async function logout() { await signOut(auth); setFirebaseUser(null); setProfile(null); }
  const value = useMemo(() => ({ firebaseUser, profile, loading, login, logout, refreshProfile, registerStudent, resetPassword, setProfile }), [firebaseUser, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
