// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// FOLDER / UNIT BASED SYSTEM
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// FIREBASE FIRESTORE IMPORTS
// ============================================================

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE AUTH IMPORTS
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIREBASE AUTH
// ============================================================

import {
    auth
} from "./firebase-auth.js";


// ============================================================
// FIREBASE APP
// ============================================================

import {
    app
} from "./firebase-config.js";


// ============================================================
// INITIALIZE FIRESTORE
// ============================================================

const db =
    getFirestore(app);


// ============================================================
// GET CURRENT LOGGED-IN USER
// ============================================================

function getLoggedInUser() {

    return auth.currentUser;

}


// ============================================================
// GET CURRENT STUDENT DATA
// ============================================================
//
// Firestore structure:
//
// students
//     └── UID
//          ├── name
//          ├── email
//          ├── mobile
//          ├── college
//          ├── accountStatus
//          └── approvedUnits
//
// ============================================================

async function getStudentData() {

    const user =
        getLoggedInUser();


    // --------------------------------------------------------
    // No logged-in user
    // --------------------------------------------------------

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


        // ----------------------------------------------------
        // Student document does not exist
        // ----------------------------------------------------

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
//
// Only "active" accounts can access approved Units.
//
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
// CHECK UNIT APPROVAL
// ============================================================
//
// Firestore example:
//
// approvedUnits: {
//
//     "unit-11": true,
//     "unit-12": false
//
// }
//
// ============================================================

async function isUnitApproved(
    unitId
) {

    const student =
        await getStudentData();


    // --------------------------------------------------------
    // Student not found
    // --------------------------------------------------------

    if (!student) {

        return false;

    }


    // --------------------------------------------------------
    // Account must be active
    // --------------------------------------------------------

    if (
        student.accountStatus !==
        "active"
    ) {

        return false;

    }


    // --------------------------------------------------------
    // Get approvedUnits
    // --------------------------------------------------------

    const approvedUnits =
        student.approvedUnits || {};


    // --------------------------------------------------------
    // Exact Unit check
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Not logged in
    // --------------------------------------------------------

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


    return true;

}


// ============================================================
// REQUIRE APPROVED UNIT
// ============================================================
//
// Unit access requires:
//
// 1. Login
// 2. Active account
// 3. approvedUnits[unitId] === true
//
// ============================================================

async function requireApprovedUnit(
    unitId
) {

    // --------------------------------------------------------
    // STEP 1 — LOGIN
    // --------------------------------------------------------

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    // --------------------------------------------------------
    // STEP 2 — ACTIVE ACCOUNT
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
    // STEP 3 — UNIT APPROVAL
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
//
// Firebase may need a short time to restore the login session
// after a page refresh.
//
// This function waits for Firebase to report the current
// authentication state.
//
// ============================================================

function waitForAuth() {

    return new Promise(
        (
            resolve
        ) => {

            let finished =
                false;


            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    (
                        user
                    ) => {

                        if (
                            finished
                        ) {

                            return;

                        }


                        finished =
                            true;


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
//
// LESSON:
//
// protectPage(
//     "lesson",
//     "unit-11"
// );
//
//
// IMPORTANT:
//
// Lessons do NOT need individual approval.
//
// A lesson checks its parent Unit.
//
// Example:
//
// Unit 11
//     ├── Lesson 1
//     ├── Lesson 2
//     ├── Lesson 3
//     ├── Lesson 4
//     └── Lesson 5
//
// approvedUnits["unit-11"] === true
//
// gives access to all Unit 11 lessons.
//
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    try {

        // ----------------------------------------------------
        // STEP 1 — WAIT FOR AUTH
        // ----------------------------------------------------

        const user =
            await waitForAuth();


        // ----------------------------------------------------
        // STEP 2 — LOGIN CHECK
        // ----------------------------------------------------

        if (!user) {

            window.location.href =
                "/all-about-english/login.html";

            return false;

        }


        // ----------------------------------------------------
        // STEP 3 — UNIT PROTECTION
        // ----------------------------------------------------

        if (
            requiredType ===
            "unit"
        ) {

            return await requireApprovedUnit(
                requiredId
            );

        }


        // ----------------------------------------------------
        // STEP 4 — LESSON PROTECTION
        // ----------------------------------------------------

        if (
            requiredType ===
            "lesson"
        ) {

            return await requireApprovedUnit(
                requiredId
            );

        }


        // ----------------------------------------------------
        // STEP 5 — ACTIVE ACCOUNT
        // ----------------------------------------------------

        if (
            requiredType ===
            "active"
        ) {

            return await requireActiveAccount();

        }


        // ----------------------------------------------------
        // UNKNOWN TYPE
        // ----------------------------------------------------

        console.error(
            "Unknown protection type:",
            requiredType
        );


        return false;

    }

    catch (error) {

        console.error(
            "Protection error:",
            error
        );


        return false;

    }

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
