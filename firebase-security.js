```javascript
// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// FOLDER / UNIT BASED SYSTEM
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    auth
} from "./firebase-auth.js";

import {
    app
} from "./firebase-config.js";


// ============================================================
// FIRESTORE
// ============================================================

const db =
    getFirestore(app);


// ============================================================
// CURRENT USER
// ============================================================

function getLoggedInUser() {

    return auth.currentUser;

}


// ============================================================
// GET CURRENT STUDENT DATA
// ============================================================

async function getStudentData() {

    const user =
        getLoggedInUser();


    if (!user) {

        return null;

    }


    try {

        const studentRef =
            doc(
                db,
                "students",
                user.uid
            );


        const studentSnap =
            await getDoc(
                studentRef
            );


        if (
            !studentSnap.exists()
        ) {

            return null;

        }


        return studentSnap.data();

    }

    catch (error) {

        console.error(
            "Student data error:",
            error
        );

        return null;

    }

}


// ============================================================
// CHECK ACCOUNT STATUS
// ============================================================

async function isAccountActive() {

    const student =
        await getStudentData();


    if (!student) {

        return false;

    }


    return (
        student.accountStatus ===
        "active"
    );

}


// ============================================================
// CHECK APPROVED UNIT
// ============================================================
//
// Firestore example:
//
// approvedUnits: {
//     "unit-11": true,
//     "unit-12": false
// }
//
// ============================================================

async function isUnitApproved(
    unitId
) {

    const student =
        await getStudentData();


    if (!student) {

        return false;

    }


    if (
        student.accountStatus !==
        "active"
    ) {

        return false;

    }


    const approvedUnits =
        student.approvedUnits || {};


    return (
        approvedUnits[unitId] ===
        true
    );

}


// ============================================================
// REQUIRE LOGIN
// ============================================================

async function requireLogin() {

    const user =
        getLoggedInUser();


    if (!user) {

        window.location.href =
            "/all-about-english/login.html";

        return false;

    }


    return true;

}


// ============================================================
// REQUIRE ACTIVE ACCOUNT
// ============================================================

async function requireActiveAccount() {

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    const active =
        await isAccountActive();


    if (!active) {

        alert(
            "Your account is not approved yet. Please contact Shaheen Sir."
        );

        return false;

    }


    return true;

}


// ============================================================
// REQUIRE APPROVED UNIT
// ============================================================
//
// IMPORTANT:
//
// এখানে কোনো device-manager নেই।
//
// Unit access শুধুমাত্র:
// 1. Login
// 2. Active account
// 3. approvedUnits[unitId] === true
//
// ============================================================

async function requireApprovedUnit(
    unitId
) {

    // --------------------------------------------------------
    // STEP 1 — Login
    // --------------------------------------------------------

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    // --------------------------------------------------------
    // STEP 2 — Active account
    // --------------------------------------------------------

    const active =
        await isAccountActive();


    if (!active) {

        alert(
            "Your account is not approved yet. Please contact Shaheen Sir."
        );

        return false;

    }


    // --------------------------------------------------------
    // STEP 3 — Unit approval
    // --------------------------------------------------------

    const approved =
        await isUnitApproved(
            unitId
        );


    if (!approved) {

        return false;

    }


    // --------------------------------------------------------
    // ACCESS GRANTED
    // --------------------------------------------------------

    return true;

}


// ============================================================
// WAIT FOR FIREBASE AUTHENTICATION
// ============================================================

function waitForAuth() {

    return new Promise(
        (
            resolve
        ) => {

            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    (
                        user
                    ) => {

                        unsubscribe();

                        resolve(
                            user
                        );

                    }
                );

        }
    );

}


// ============================================================
// PROTECT PAGE
// ============================================================
//
// UNIT:
//
// protectPage(
//     "unit",
//     "unit-11"
// );
//
// LESSON:
//
// protectPage(
//     "lesson",
//     "unit-11"
// );
//
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    // --------------------------------------------------------
    // STEP 1 — Wait for Firebase Auth
    // --------------------------------------------------------

    const user =
        await waitForAuth();


    // --------------------------------------------------------
    // STEP 2 — Login check
    // --------------------------------------------------------

    if (!user) {

        window.location.href =
            "/all-about-english/login.html";

        return false;

    }


    // --------------------------------------------------------
    // STEP 3 — UNIT
    // --------------------------------------------------------

    if (
        requiredType ===
        "unit"
    ) {

        return await requireApprovedUnit(
            requiredId
        );

    }


    // --------------------------------------------------------
    // STEP 4 — LESSON
    // --------------------------------------------------------

    if (
        requiredType ===
        "lesson"
    ) {

        return await requireApprovedUnit(
            requiredId
        );

    }


    // --------------------------------------------------------
    // STEP 5 — ACTIVE ACCOUNT
    // --------------------------------------------------------

    if (
        requiredType ===
        "active"
    ) {

        return await requireActiveAccount();

    }


    // --------------------------------------------------------
    // UNKNOWN TYPE
    // --------------------------------------------------------

    console.error(
        "Unknown protection type:",
        requiredType
    );


    return false;

}


// ============================================================
// EXPORT
// ============================================================

export {

    getLoggedInUser,

    getStudentData,

    isAccountActive,

    isUnitApproved,

    requireLogin,

    requireActiveAccount,

    requireApprovedUnit,

    waitForAuth,

    protectPage

};
```
