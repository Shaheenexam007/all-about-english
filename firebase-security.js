// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// FOLDER / UNIT BASED SYSTEM
// ADMIN + STUDENT SUPPORT
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

const db = getFirestore(app);


// ============================================================
// ADMIN EMAIL
// ============================================================
//
// IMPORTANT:
// Put the SAME admin email here that you use to login
// to the Admin Dashboard.
//
// Change ONLY this email if your admin email is different.
//
// ============================================================

const ADMIN_EMAIL =
    "shaheenexam007@gmail.com";


// ============================================================
// ADMIN UID
// ============================================================
//
// OPTIONAL BUT STRONGLY RECOMMENDED
//
// If you know your Firebase Admin UID, put it here.
//
// Example:
//
// const ADMIN_UID =
//     "xxxxxxxxxxxxxxxxxxxxxxxx";
//
// If you don't know the UID, leave it empty.
//
// ============================================================

const ADMIN_UID = "";


// ============================================================
// GET CURRENT LOGGED-IN USER
// ============================================================

function getLoggedInUser() {

    return auth.currentUser;

}


// ============================================================
// CHECK WHETHER CURRENT USER IS ADMIN
// ============================================================

function isAdmin() {

    const user =
        getLoggedInUser();


    // --------------------------------------------------------
    // No user
    // --------------------------------------------------------

    if (!user) {

        return false;

    }


    // --------------------------------------------------------
    // Check UID first
    // --------------------------------------------------------

    if (
        ADMIN_UID &&
        user.uid === ADMIN_UID
    ) {

        return true;

    }


    // --------------------------------------------------------
    // Check email
    // --------------------------------------------------------

    if (
        user.email &&
        user.email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    ) {

        return true;

    }


    return false;

}


// ============================================================
// GET CURRENT STUDENT DATA
// ============================================================
//
// Firestore:
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


    // --------------------------------------------------------
    // ADMIN DOES NOT NEED STUDENT DATA
    // --------------------------------------------------------

    if (isAdmin()) {

        return {

            role: "admin",

            email:
                user.email || "",

            uid:
                user.uid

        };

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
// ADMIN:
//     Always active.
//
// STUDENT:
//     accountStatus must be "active".
//
// ============================================================

async function isAccountActive() {

    // --------------------------------------------------------
    // ADMIN BYPASS
    // --------------------------------------------------------

    if (isAdmin()) {

        return true;

    }


    // --------------------------------------------------------
    // STUDENT CHECK
    // --------------------------------------------------------

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
// ADMIN:
//     Always approved.
//
// STUDENT:
//     approvedUnits[unitId] === true
//
// ============================================================

async function isUnitApproved(
    unitId
) {

    // --------------------------------------------------------
    // ADMIN HAS FULL ACCESS
    // --------------------------------------------------------

    if (isAdmin()) {

        return true;

    }


    // --------------------------------------------------------
    // STUDENT DATA
    // --------------------------------------------------------

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
//
// ADMIN:
//     Automatically allowed.
//
// STUDENT:
//     accountStatus must be "active".
//
// ============================================================

async function requireActiveAccount() {

    // --------------------------------------------------------
    // STEP 1 — LOGIN
    // --------------------------------------------------------

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    // --------------------------------------------------------
    // STEP 2 — ADMIN BYPASS
    // --------------------------------------------------------

    if (isAdmin()) {

        return true;

    }


    // --------------------------------------------------------
    // STEP 3 — STUDENT ACTIVE CHECK
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
// ADMIN:
//     Full access to every Unit.
//
// STUDENT:
//     Login
//     +
//     Active account
//     +
//     Unit approved
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
    // STEP 2 — ADMIN BYPASS
    // --------------------------------------------------------

    if (isAdmin()) {

        console.log(
            "ADMIN ACCESS GRANTED:",
            unitId
        );

        return true;

    }


    // --------------------------------------------------------
    // STEP 3 — ACTIVE ACCOUNT
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
    // STEP 4 — UNIT APPROVAL
    // --------------------------------------------------------

    const approved =
        await isUnitApproved(
            unitId
        );


    if (!approved) {

        console.log(
            "UNIT ACCESS DENIED:",
            unitId
        );

        return false;

    }


    // --------------------------------------------------------
    // ACCESS GRANTED
    // --------------------------------------------------------

    console.log(
        "STUDENT UNIT ACCESS GRANTED:",
        unitId
    );


    return true;

}


// ============================================================
// WAIT FOR FIREBASE AUTHENTICATION
// ============================================================
//
// Firebase may need time to restore the login session
// after a page refresh.
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
// LESSON:
//
// protectPage(
//     "lesson",
//     "unit-11"
// );
//
// ACTIVE:
//
// protectPage(
//     "active",
//     "active"
// );
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
        // STEP 3 — ADMIN FULL ACCESS
        // ----------------------------------------------------

        if (isAdmin()) {

            console.log(
                "ADMIN FULL ACCESS GRANTED"
            );

            return true;

        }


        // ----------------------------------------------------
        // STEP 4 — UNIT PROTECTION
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
        // STEP 5 — LESSON PROTECTION
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
        // STEP 6 — ACTIVE ACCOUNT
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

    isAdmin,

    isAccountActive,

    isUnitApproved,

    requireLogin,

    requireActiveAccount,

    requireApprovedUnit,

    waitForAuth,

    protectPage

};
