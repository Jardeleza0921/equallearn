// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";


const firebaseConfig = {

    apiKey: "AIzaSyDs5tws2jGZAS2q-9op_lIgAdyqfIXW4Uw",

    authDomain: "equallearn-eb389.firebaseapp.com",

    projectId: "equallearn-eb389",

    storageBucket: "equallearn-eb389.firebasestorage.app",

    messagingSenderId: "897069961442",

    appId: "1:897069961442:web:98dfabd5efefa1e79a4ebb"

};


// ========================================
// MAIN FIREBASE APP
// ========================================

const app = initializeApp(firebaseConfig);


// ========================================
// FIREBASE SERVICES
// ========================================

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


// ========================================
// EXPORT
// ========================================

export {
    app,
    auth,
    db,
    storage,
    firebaseConfig
};