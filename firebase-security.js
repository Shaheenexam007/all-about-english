// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE SECURITY & ACCESS CONTROL
// FOLDER / UNIT BASED SYSTEM
// MAXIMUM 2 DEVICES PER ACCOUNT
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
// DEVICE ACCESS
// ============================================================
//
// Maximum 2 devices per student account.
//
// First device:
// → registered automatically
//
// Second device:
// → registered automatically
//
// Third device:
// → blocked
//
// Existing Unit approval remains unchanged.
// ============================================================

async function requireDeviceAccess() {

    try {

        const result =
            await checkDeviceAccess();


        if (
            result.allowed
        ) {

            return true;

        }


        // ----------------------------------------------------
        // Login required
        // ----------------------------------------------------

        if (
            result.reason ===
            "not-logged-in"
        ) {

            window.location.href =
                "/all-about-english/login.html";

            return false;

        }


        // ----------------------------------------------------
        // Student document not found
        // ----------------------------------------------------

        if (
            result.reason ===
            "student-not-found"
        ) {

            alert(
                "Student account information could not be found. Please contact Shaheen Sir."
            );

            return false;

        }


        // ----------------------------------------------------
        // Maximum devices reached
        // ----------------------------------------------------

        if (
            result.reason ===
            "device-limit-reached"
        ) {

            document.body.innerHTML = `

                <div style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:25px;
                    background:#fbfaf6;
                    font-family:Arial,sans-serif;
                    text-align:center;
                ">

                    <div style="
                        width:min(500px,100%);
                        background:white;
                        padding:40px 28px;
                        border-radius:20px;
                        border:1px solid #e7e4dc;
                        box-shadow:0 15px 45px rgba(0,0,0,.08);
                    ">

                        <div style="
                            font-size:45px;
                            margin-bottom:15px;
                        ">
                            📱
                        </div>

                        <h2 style="
                            color:#101b36;
                            margin-bottom:12px;
                        ">
                            Device Limit Reached
                        </h2>

                        <p style="
                            color:#68748a;
                            line-height:1.7;
                            font-size:14px;
                            margin-bottom:10px;
                        ">
                            This account is already registered
                            on the maximum of
                            <strong>2 devices</strong>.
                        </p>

                        <p style="
                            color:#68748a;
                            line-height:1.7;
                            font-size:13px;
                        ">
                            Please use one of your registered
                            devices or contact Shaheen Sir
                            if you need to change a device.
                        </p>

                        <a
                            href="/all-about-english/"
                            style="
                                display:inline-block;
                                margin-top:20px;
                                padding:11px 20px;
                                background:#101b36;
                                color:white;
                                text-decoration:none;
                                border-radius:9px;
                                font-size:13px;
                                font-weight:bold;
                            "
                        >
                            Go to Homepage
                        </a>

                    </div>

                </div>

            `;

            return false;

        }


        // ----------------------------------------------------
        // Other device error
        // ----------------------------------------------------

        alert(
            "This device could not be verified. Please contact Shaheen Sir."
        );


        return false;

    }

    catch (error) {

        console.error(
            "Device access error:",
            error
        );


        alert(
            "Unable to verify this device. Please refresh the page."
        );


        return false;

    }

}


// ============================================================
// REQUIRE APPROVED UNIT
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
    // STEP 3 — Device check
    // --------------------------------------------------------

    const deviceAllowed =
        await requireDeviceAccess();


    if (!deviceAllowed) {

        return false;

    }


    // --------------------------------------------------------
    // STEP 4 — Unit approval
    // --------------------------------------------------------

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
// Both use the parent's Unit approval.
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
    // STEP 2 — Login
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
    //
    // Lesson checks parent Unit.
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
    // STEP 5 — ACTIVE ACCOUNT
    // --------------------------------------------------------

    if (
        requiredType ===
        "active"
    ) {

        const active =
            await requireActiveAccount();


        if (!active) {

            return false;

        }


        return await requireDeviceAccess();

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

    requireDeviceAccess,

    requireApprovedUnit,

    waitForAuth,

    protectPage

};
