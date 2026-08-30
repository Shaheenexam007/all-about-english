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
// GET STUDENT DATA
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


        if (!studentSnap.exists()) {

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
// CHECK APPROVED LESSON
// ============================================================

async function isLessonApproved(
    lessonId
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


    const approvedLessons =
        student.approvedLessons || {};


    return (
        approvedLessons[lessonId] ===
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
            "You do not have permission to access this unit."
        );


        return false;

    }


    return true;

}


// ============================================================
// REQUIRE APPROVED LESSON
// ============================================================

async function requireApprovedLesson(
    lessonId
) {

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return false;

    }


    const approved =
        await isLessonApproved(
            lessonId
        );


    if (!approved) {

        alert(
            "You do not have permission to access this lesson."
        );


        return false;

    }


    return true;

}


// ============================================================
// WAIT FOR AUTHENTICATION
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
// PROTECT DIRECT ACCESS
// ============================================================

async function protectPage(
    requiredType,
    requiredId
) {

    const user =
        await waitForAuth();


    if (!user) {

        window.location.href =
            "/all-about-english/login.html";

        return false;

    }


    if (
        requiredType ===
        "unit"
    ) {

        return await requireApprovedUnit(
            requiredId
        );

    }


    if (
        requiredType ===
        "lesson"
    ) {

        return await requireApprovedLesson(
            requiredId
        );

    }


    if (
        requiredType ===
        "active"
    ) {

        return await requireActiveAccount();

    }


    return true;

}


// ============================================================
// EXPORT
// ============================================================

export {

    getLoggedInUser,

    getStudentData,

    isAccountActive,

    isUnitApproved,

    isLessonApproved,

    requireLogin,

    requireActiveAccount,

    requireApprovedUnit,

    requireApprovedLesson,

    waitForAuth,

    protectPage

};
