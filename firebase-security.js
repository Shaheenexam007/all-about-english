// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
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
    app
} from "./firebase-config.js";

import {
    auth
} from "./firebase-auth.js";


const db = getFirestore(app);


const LOGIN_PAGE =
    "/all-about-english/login.html";



/* ============================================================
   GET CURRENT LOGGED-IN USER
   ============================================================ */

function getLoggedInUser() {

    return auth.currentUser;

}



/* ============================================================
   WAIT FOR FIREBASE AUTH
   ============================================================ */

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



/* ============================================================
   GET STUDENT DATA
   ============================================================ */

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


    } catch (error) {

        console.error(
            "getStudentData error:",
            error
        );

        return null;

    }

}



/* ============================================================
   ACCOUNT ACTIVE CHECK
   ============================================================ */

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



/* ============================================================
   1ST PAPER — UNIT APPROVAL CHECK
   EXISTING SYSTEM
   ============================================================ */

async function isUnitApproved(unitId) {

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
        student.approvedUnits ||
        {};


    return (
        approvedUnits[unitId] ===
        true
    );

}



/* ============================================================
   2ND PAPER — GRAMMAR ITEM EXPIRY HELPER
   ============================================================ */

/*
   Grammar approval expiry is stored like this:

   grammarAccessExpiryDates: {
       "modifiers": Timestamp,
       "article": Timestamp
   }

   The function below safely handles Firestore Timestamp,
   JavaScript Date and timestamp-like values.
*/

function getExpiryTime(value) {

    if (!value) {

        return null;

    }


    /* Firestore Timestamp */

    if (
        typeof value.toDate ===
        "function"
    ) {

        const date =
            value.toDate();

        if (
            date instanceof Date &&
            !isNaN(date.getTime())
        ) {

            return date.getTime();

        }

    }


    /* JavaScript Date */

    if (
        value instanceof Date
    ) {

        if (
            !isNaN(
                value.getTime()
            )
        ) {

            return value.getTime();

        }

    }


    /* Number timestamp */

    if (
        typeof value ===
        "number"
    ) {

        return value;

    }


    /* String date */

    if (
        typeof value ===
        "string"
    ) {

        const time =
            new Date(
                value
            ).getTime();

        if (
            !isNaN(time)
        ) {

            return time;

        }

    }


    return null;

}



/* ============================================================
   2ND PAPER — GRAMMAR ITEM APPROVAL CHECK
   ============================================================ */

async function isGrammarItemApproved(
    grammarId
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


    const approvedGrammarItems =
        student.approvedGrammarItems ||
        {};


    /*
       Grammar item must first be approved.
    */

    if (
        approvedGrammarItems[grammarId] !==
        true
    ) {

        return false;

    }


    /*
       ----------------------------------------------------------
       EXPIRY CHECK
       ----------------------------------------------------------

       If an expiry date exists and the current time has passed
       that date, access is denied.

       This means an expired grammar item cannot remain accessible
       simply because approvedGrammarItems still says true.

       The Admin Dashboard will also automatically revoke expired
       grammar approvals from Firestore.
    */

    const grammarExpiryDates =
        student.grammarAccessExpiryDates ||
        {};


    const expiryValue =
        grammarExpiryDates[
            grammarId
        ];


    const expiryTime =
        getExpiryTime(
            expiryValue
        );


    if (
        expiryTime !== null
    ) {

        if (
            Date.now() >=
            expiryTime
        ) {

            console.log(
                "Grammar item access expired:",
                grammarId
            );

            return false;

        }

    }


    /*
       If no expiry date exists, preserve backward compatibility.

       This allows an already-approved grammar item to continue
       working until the Admin Dashboard assigns an expiry date.
    */

    return true;

}



/* ============================================================
   REQUIRE LOGIN
   ============================================================ */

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



/* ============================================================
   REQUIRE ACTIVE ACCOUNT
   ============================================================ */

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



/* ============================================================
   REQUIRE APPROVED UNIT
   1ST PAPER
   ============================================================ */

async function requireApprovedUnit(
    unitId
) {

    try {

        const user =
            await waitForAuth();


        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


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


        if (
            student.accountStatus !==
            "active"
        ) {

            alert(
                "Your account is not active yet. Please contact Shaheen Sir."
            );

            return false;

        }


        const approvedUnits =
            student.approvedUnits ||
            {};


        const approved =
            approvedUnits[unitId] ===
            true;


        if (!approved) {

            console.log(
                "Unit access denied:",
                unitId
            );

            return false;

        }


        console.log(
            "Unit access granted:",
            unitId
        );


        return true;


    } catch (error) {

        console.error(
            "requireApprovedUnit error:",
            error
        );

        return false;

    }

}



/* ============================================================
   REQUIRE APPROVED GRAMMAR ITEM
   2ND PAPER
   ============================================================ */

async function requireApprovedGrammarItem(
    grammarId
) {

    try {

        const user =
            await waitForAuth();


        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


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


        if (
            student.accountStatus !==
            "active"
        ) {

            alert(
                "Your account is not active yet. Please contact Shaheen Sir."
            );

            return false;

        }


        const approved =
            await isGrammarItemApproved(
                grammarId
            );


        if (!approved) {

            console.log(
                "Grammar item access denied:",
                grammarId
            );

            return false;

        }


        console.log(
            "Grammar item access granted:",
            grammarId
        );


        return true;


    } catch (error) {

        console.error(
            "requireApprovedGrammarItem error:",
            error
        );

        return false;

    }

}



/* ============================================================
   UNIVERSAL PAGE PROTECTION
   ============================================================ */

/*
   Existing usage:

       protectPage(
           "unit",
           "unit-12"
       );


   New 2nd Paper usage:

       protectPage(
           "grammar",
           "modifiers"
       );


   Other existing usage:

       protectPage(
           "active"
       );
*/

async function protectPage(
    requiredType,
    requiredId
) {

    try {

        const user =
            await waitForAuth();


        if (!user) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


        /* ====================================================
           1ST PAPER — UNIT
           ==================================================== */

        if (
            requiredType ===
            "unit"
        ) {

            return await requireApprovedUnit(
                requiredId
            );

        }


        /* ====================================================
           1ST PAPER — LESSON
           Existing behaviour preserved.
           ==================================================== */

        if (
            requiredType ===
            "lesson"
        ) {

            return await requireApprovedUnit(
                requiredId
            );

        }


        /* ====================================================
           2ND PAPER — GRAMMAR ITEM
           ==================================================== */

        if (
            requiredType ===
            "grammar"
        ) {

            return await requireApprovedGrammarItem(
                requiredId
            );

        }


        /* ====================================================
           ACTIVE ACCOUNT
           ==================================================== */

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


    } catch (error) {

        console.error(
            "protectPage error:",
            error
        );

        return false;

    }

}



/* ============================================================
   EXPORT
   ============================================================ */

export {

    getLoggedInUser,

    getStudentData,

    isAccountActive,

    isUnitApproved,

    isGrammarItemApproved,

    requireLogin,

    requireActiveAccount,

    requireApprovedUnit,

    requireApprovedGrammarItem,

    waitForAuth,

    protectPage

};
