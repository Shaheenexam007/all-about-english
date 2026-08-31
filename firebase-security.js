// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// FIREBASE FIRESTORE
// ============================================================

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE AUTH
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIREBASE APP
// ============================================================

import {
    app
} from "./firebase-config.js";

import {
    auth
} from "./firebase-auth.js";


// ============================================================
// FIRESTORE
// ============================================================

const db = getFirestore(app);


// ============================================================
// LOGIN PAGE
// ============================================================

const LOGIN_PAGE =
    "/all-about-english/login.html";


// ============================================================
// GET CURRENT USER
// ============================================================

function getLoggedInUser() {

    return auth.currentUser;

}


// ============================================================
// WAIT FOR AUTH
// ============================================================

function waitForAuth() {

    return new Promise((resolve) => {

        let finished = false;

        const unsubscribe =
            onAuthStateChanged(
                auth,
                (user) => {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    unsubscribe();

                    resolve(user);

                }
            );

    });

}


// ============================================================
// GET STUDENT DATA
// ============================================================

async function getStudentData() {

    const user =
        auth.currentUser;


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


        if (!studentSnap.exists()) {

            return null;

        }


        return studentSnap.data();

    }

    catch (error) {

        console.error(
            "getStudentData error:",
            error
        );

        return null;

    }

}


// ============================================================
// CHECK ACTIVE ACCOUNT
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

async function isUnitApproved(
    unitId
) {

    const student =
        await getStudentData();


    if (!student) {

        return false;

    }


    // --------------------------------------------------------
    // ACCOUNT MUST BE ACTIVE
    // --------------------------------------------------------

    if (
        student.accountStatus !==
        "active"
    ) {

        return false;

    }


    // --------------------------------------------------------
    // APPROVED UNITS
    // --------------------------------------------------------

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
        await waitForAuth();


    if (!user) {

        window.location.href =
            LOGIN_PAGE;

        return false;

    }


    return true;

}


// ============================================================
// REQUIRE ACTIVE ACCOUNT
// ============================================================

async function requireActiveAccount() {

    const user =
        await waitForAuth();


    if (!user) {

        window.location.href =
            LOGIN_PAGE;

        return false;

    }


    const active =
        await isAccountActive();


    if (!active) {

        alert(
            "Your account is not active yet. Please contact Shaheen Sir."
        );

        return false;

    }


    return true;

}


// ============================================================
// REQUIRE APPROVED UNIT
// ============================================================
//
// Example:
//
// requireApprovedUnit("unit-11");
//
// requireApprovedUnit("unit-12");
//
// ============================================================

async function requireApprovedUnit(
    unitId
) {

    try {

        // ----------------------------------------------------
        // WAIT FOR FIREBASE AUTH
        // ----------------------------------------------------

        const user =
            await waitForAuth();


        // ----------------------------------------------------
        // NOT LOGGED IN
        // ----------------------------------------------------

        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


        // ----------------------------------------------------
        // GET STUDENT
        // ----------------------------------------------------

        const student =
            await getStudentData();


        if (!student) {

            console.error(
                "Student document not found."
            );

            alert(
                "Your student account information could not be found. Please contact Shaheen Sir."
            );

            return false;

        }


        // ----------------------------------------------------
        // ACCOUNT STATUS
        // ----------------------------------------------------

        if (
            student.accountStatus !==
            "active"
        ) {

            alert(
                "Your account is not active yet. Please contact Shaheen Sir."
            );

            return false;

        }


        // ----------------------------------------------------
        // APPROVED UNITS
        // ----------------------------------------------------

        const approvedUnits =
            student.approvedUnits || {};


        const approved =
            approvedUnits[unitId] ===
            true;


        // ----------------------------------------------------
        // UNIT NOT APPROVED
        // ----------------------------------------------------

        if (!approved) {

            console.log(
                "Unit access denied:",
                unitId
            );

            return false;

        }


        // ----------------------------------------------------
        // ACCESS GRANTED
        // ----------------------------------------------------

        console.log(
            "Unit access granted:",
            unitId
        );

        return true;

    }

    catch (error) {

        console.error(
            "requireApprovedUnit error:",
            error
        );

        return false;

    }

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
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    try {

        const user =
            await waitForAuth();


        // ----------------------------------------------------
        // LOGIN REQUIRED
        // ----------------------------------------------------

        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


        // ----------------------------------------------------
        // UNIT
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
        // LESSON
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
        // ACTIVE ACCOUNT
        // ----------------------------------------------------

        if (
            requiredType ===
            "active"
        ) {

            return await requireActiveAccount();

        }


        console.error(
            "Unknown protection type:",
            requiredType
        );

        return false;

    }

    catch (error) {

        console.error(
            "protectPage error:",
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
