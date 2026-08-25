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

    apiKey: "AIzaSyDLpkH-uQlPy3idTh_rdZgp_SP-rMF298U",

    authDomain: "equallearn-test.firebaseapp.com",

    projectId: "equallearn-test",

    storageBucket: "equallearn-test.firebasestorage.app",

    messagingSenderId: "708796542875",

    appId: "1:708796542875:web:1a415e6a8e43e7806ebb3e"

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