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
// LOGIN USER
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


    // --------------------------------------------------------
    // No user
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
// CHECK APPROVED FOLDER / UNIT
// ============================================================
//
// Example Firestore:
//
// approvedUnits: {
//     "unit-11": true,
//     "unit-12": false
// }
//
// If unit-11 is true:
// → Unit 11 folder is accessible
// → All lessons inside Unit 11 are accessible
//
// ============================================================

async function isUnitApproved(
    unitId
) {

    const student =
        await getStudentData();


    // --------------------------------------------------------
    // Student data not found
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
    // Check requested Unit
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
// REQUIRE APPROVED FOLDER / UNIT
// ============================================================

async function requireApprovedUnit(
    unitId
) {

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    const approved =
        await isUnitApproved(
            unitId
        );


    if (!approved) {

        alert(
            "You do not have permission to access this folder."
        );


        return false;

    }


    return true;

}


// ============================================================
// WAIT FOR FIREBASE AUTHENTICATION
// ============================================================
//
// Important:
// Firebase may need a short time to restore the user's
// login session after page refresh.
//
// This function waits until Firebase tells us the
// authentication state.
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
// PROTECT FOLDER / UNIT PAGE
// ============================================================
//
// Use inside:
//
// unit-11/index.html
//
// Example:
//
// await protectPage(
//     "unit",
//     "unit-11"
// );
//
// ============================================================


// ============================================================
// PROTECT LESSON PAGE
// ============================================================
//
// IMPORTANT:
//
// Lessons do NOT have individual approval.
//
// A lesson checks the approval of its parent Unit.
//
// Example:
//
// Lesson 1 inside Unit 11:
//
// await protectPage(
//     "lesson",
//     "unit-11"
// );
//
// Lesson 2 inside Unit 11:
//
// await protectPage(
//     "lesson",
//     "unit-11"
// );
//
// Lesson 3 inside Unit 11:
//
// await protectPage(
//     "lesson",
//     "unit-11"
// );
//
// Therefore:
//
// approvedUnits["unit-11"] === true
//
// is enough to access ALL lessons of Unit 11.
//
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    // --------------------------------------------------------
    // STEP 1
    // Wait for Firebase authentication
    // --------------------------------------------------------

    const user =
        await waitForAuth();


    // --------------------------------------------------------
    // STEP 2
    // Login check
    // --------------------------------------------------------

    if (!user) {

        window.location.href =
            "/all-about-english/login.html";

        return false;

    }


    // --------------------------------------------------------
    // STEP 3
    // Folder / Unit protection
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
    // STEP 4
    // Lesson protection
    // --------------------------------------------------------
    //
    // Lesson uses parent Unit approval.
    //
    // Example:
    //
    // protectPage(
    //     "lesson",
    //     "unit-11"
    // );
    //
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
    // STEP 5
    // Active account protection
    // --------------------------------------------------------

    if (
        requiredType ===
        "active"
    ) {

        return await requireActiveAccount();

    }


    // --------------------------------------------------------
    // Unknown protection type
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
