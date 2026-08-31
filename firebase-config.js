// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE CONFIGURATION
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// FIREBASE APP IMPORT
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
//
// IMPORTANT:
// নিচের configuration আপনার Firebase project-এর
// configuration অনুযায়ী থাকতে হবে.
//
// ============================================================

const firebaseConfig = {

    apiKey:
        "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT.firebaseapp.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(
        firebaseConfig
    );


// ============================================================
// EXPORT
// ============================================================

export {
    app
};
