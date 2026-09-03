import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDLpkH-uQlPy3idTh_rdZgp_SP-rMF298U',
  authDomain: 'equallearn-test.firebaseapp.com',
  projectId: 'equallearn-test',
  storageBucket: 'equallearn-test.firebasestorage.app',
  messagingSenderId: '708796542875',
  appId: '1:708796542875:web:1a415e6a8e43e7806ebb3e',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
