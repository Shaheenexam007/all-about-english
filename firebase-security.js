// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// FOLDER / UNIT BASED SYSTEM
// BY SHAHEEN SIR
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
// GET CURRENT LOGIN USER
// ============================================================

function getLoggedInUser() {

    return auth.currentUser;

}


// ============================================================
// WAIT FOR FIREBASE AUTH
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
// GET STUDENT DATA
// ============================================================

async function getStudentData(
    user = null
) {

    // --------------------------------------------------------
    // If user was supplied, use that user.
    // Otherwise use current Firebase user.
    // --------------------------------------------------------

    const currentUser =
        user || getLoggedInUser();


    if (!currentUser) {

        return null;

    }


    try {

        const studentRef =
            doc(
                db,
                "students",
                currentUser.uid
            );


        const studentSnap =
            await getDoc(
                studentRef
            );


        if (
            !studentSnap.exists()
        ) {

            console.error(
                "Student document not found:",
                currentUser.uid
            );

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

async function isAccountActive(
    user = null
) {

    const student =
        await getStudentData(
            user
        );


    if (!student) {

        return false;

    }


    return (
        String(
            student.accountStatus || ""
        )
            .toLowerCase()
            .trim() ===
        "active"
    );

}


// ============================================================
// CHECK APPROVED UNIT
// ============================================================
//
// Firestore structure:
//
// students
//   └── USER UID
//       └── approvedUnits
//           ├── unit-11: true
//           ├── unit-12: false
//
// ============================================================

async function isUnitApproved(
    unitId,
    user = null
) {

    const student =
        await getStudentData(
            user
        );


    if (!student) {

        console.error(
            "No student data found."
        );

        return false;

    }


    // --------------------------------------------------------
    // ACCOUNT MUST BE ACTIVE
    // --------------------------------------------------------

    const accountStatus =
        String(
            student.accountStatus || ""
        )
            .toLowerCase()
            .trim();


    if (
        accountStatus !==
        "active"
    ) {

        console.log(
            "Student account is not active:",
            accountStatus
        );

        return false;

    }


    // --------------------------------------------------------
    // APPROVED UNITS
    // --------------------------------------------------------

    const approvedUnits =
        student.approvedUnits || {};


    // --------------------------------------------------------
    // CHECK REQUESTED UNIT
    // --------------------------------------------------------

    const approved =
        approvedUnits[unitId] === true;


    console.log(
        "Unit access check:",
        unitId,
        approved
    );


    return approved;

}


// ============================================================
// REQUIRE LOGIN
// ============================================================

async function requireLogin(
    user = null
) {

    const currentUser =
        user || getLoggedInUser();


    if (!currentUser) {

        window.location.href =
            "/all-about-english/login.html";

        return false;

    }


    return true;

}


// ============================================================
// REQUIRE ACTIVE ACCOUNT
// ============================================================

async function requireActiveAccount(
    user = null
) {

    const loggedIn =
        await requireLogin(
            user
        );


    if (!loggedIn) {

        return false;

    }


    const active =
        await isAccountActive(
            user
        );


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

async function requireApprovedUnit(
    unitId,
    user = null
) {

    const loggedIn =
        await requireLogin(
            user
        );


    if (!loggedIn) {

        return false;

    }


    const approved =
        await isUnitApproved(
            unitId,
            user
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
// IMPORTANT:
// Lesson approval is controlled by its parent Unit.
//
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    try {

        // ----------------------------------------------------
        // STEP 1
        // WAIT FOR FIREBASE AUTH
        // ----------------------------------------------------

        const user =
            await waitForAuth();


        console.log(
            "Firebase auth state:",
            user
                ? user.uid
                : "NOT LOGGED IN"
        );


        // ----------------------------------------------------
        // STEP 2
        // LOGIN CHECK
        // ----------------------------------------------------

        if (!user) {

            window.location.href =
                "/all-about-english/login.html";

            return false;

        }


        // ----------------------------------------------------
        // STEP 3
        // UNIT / FOLDER
        // ----------------------------------------------------

        if (
            requiredType ===
            "unit"
        ) {

            return await requireApprovedUnit(
                requiredId,
                user
            );

        }


        // ----------------------------------------------------
        // STEP 4
        // LESSON
        // ----------------------------------------------------
        //
        // Lesson uses parent Unit approval.
        //
        // Example:
        //
        // Unit 11 Lesson 1:
        //
        // protectPage(
        //     "lesson",
        //     "unit-11"
        // );
        //
        // ----------------------------------------------------

        if (
            requiredType ===
            "lesson"
        ) {

            return await requireApprovedUnit(
                requiredId,
                user
            );

        }


        // ----------------------------------------------------
        // STEP 5
        // ACTIVE ACCOUNT
        // ----------------------------------------------------

        if (
            requiredType ===
            "active"
        ) {

            return await requireActiveAccount(
                user
            );

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
            "Page protection error:",
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
