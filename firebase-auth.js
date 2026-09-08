// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE AUTHENTICATION
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// FIREBASE AUTH IMPORTS
// ============================================================

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// FIRESTORE IMPORTS
// ============================================================

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE APP
// ============================================================

import {
    app
} from "./firebase-config.js";


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================================
// DEVICE SETTINGS
// ============================================================

const DEVICE_STORAGE_KEY =
    "aae_student_device_id";

const DEVICE_ALLOWED_KEY =
    "aae_device_allowed";


// ============================================================
// DEBUG
// ============================================================

console.log(
    "🔥 firebase-auth.js loaded successfully."
);


// ============================================================
// GET DEVICE ID
// ============================================================

function getDeviceId() {

    try {

        let deviceId =
            localStorage.getItem(
                DEVICE_STORAGE_KEY
            );


        // ----------------------------------------------------
        // EXISTING DEVICE
        // ----------------------------------------------------

        if (deviceId) {

            return deviceId;

        }


        // ----------------------------------------------------
        // CREATE NEW DEVICE ID
        // ----------------------------------------------------

        deviceId =
            "AAE-" +
            Date.now().toString(36) +
            "-" +
            crypto.randomUUID();


        localStorage.setItem(
            DEVICE_STORAGE_KEY,
            deviceId
        );


        return deviceId;

    }

    catch (error) {

        console.error(
            "❌ Device ID error:",
            error
        );

        return null;

    }

}


// ============================================================
// REGISTER CURRENT DEVICE
// ============================================================
//
// Maximum 2 devices per student.
//
// Device 1 → allowed
// Device 2 → allowed
// Device 3 → blocked
//
// IMPORTANT:
// Device limit NEVER signs the Firebase user out.
// ============================================================

async function registerCurrentDevice(
    uid
) {

    try {

        if (!uid) {

            return {
                success: false,
                allowed: false,
                message:
                    "Student account could not be identified."
            };

        }


        const currentDevice =
            getDeviceId();


        if (!currentDevice) {

            return {
                success: false,
                allowed: false,
                message:
                    "Unable to identify this device."
            };

        }


        const studentRef =
            doc(
                db,
                "students",
                uid
            );


        // ----------------------------------------------------
        // TRANSACTION
        // ----------------------------------------------------
        //
        // Transaction prevents two new devices from
        // simultaneously occupying the same device slot.
        //
        // ----------------------------------------------------

        const result =
            await runTransaction(
                db,
                async (transaction) => {

                    const snapshot =
                        await transaction.get(
                            studentRef
                        );


                    if (!snapshot.exists()) {

                        return {
                            allowed: false,
                            reason:
                                "Student account record was not found."
                        };

                    }


                    const data =
                        snapshot.data();


                    const device1 =
                        String(
                            data.device1 || ""
                        ).trim();


                    const device2 =
                        String(
                            data.device2 || ""
                        ).trim();


                    // ------------------------------------------------
                    // EXISTING DEVICE 1
                    // ------------------------------------------------

                    if (
                        device1 &&
                        device1 ===
                            currentDevice
                    ) {

                        return {
                            allowed: true,
                            existing: true,
                            slot: 1
                        };

                    }


                    // ------------------------------------------------
                    // EXISTING DEVICE 2
                    // ------------------------------------------------

                    if (
                        device2 &&
                        device2 ===
                            currentDevice
                    ) {

                        return {
                            allowed: true,
                            existing: true,
                            slot: 2
                        };

                    }


                    // ------------------------------------------------
                    // DEVICE 1 EMPTY
                    // ------------------------------------------------

                    if (!device1) {

                        transaction.update(
                            studentRef,
                            {
                                device1:
                                    currentDevice
                            }
                        );


                        return {
                            allowed: true,
                            existing: false,
                            slot: 1
                        };

                    }


                    // ------------------------------------------------
                    // DEVICE 2 EMPTY
                    // ------------------------------------------------

                    if (!device2) {

                        transaction.update(
                            studentRef,
                            {
                                device2:
                                    currentDevice
                            }
                        );


                        return {
                            allowed: true,
                            existing: false,
                            slot: 2
                        };

                    }


                    // ------------------------------------------------
                    // THIRD DEVICE
                    // ------------------------------------------------

                    return {
                        allowed: false,
                        existing: false,
                        slot: 3,
                        reason:
                            "This account is already registered on two devices."
                    };

                }
            );


        // ----------------------------------------------------
        // ALLOWED
        // ----------------------------------------------------

        if (result.allowed) {

            localStorage.setItem(
                DEVICE_ALLOWED_KEY,
                "true"
            );


            console.log(
                "✅ Device allowed. Slot:",
                result.slot
            );


            return {
                success: true,
                allowed: true,
                existing:
                    result.existing,
                slot:
                    result.slot,
                message:
                    result.existing
                        ? "Existing device recognized."
                        : "This device has been registered successfully."
            };

        }


        // ----------------------------------------------------
        // NOT ALLOWED
        // ----------------------------------------------------

        localStorage.setItem(
            DEVICE_ALLOWED_KEY,
            "false"
        );


        console.warn(
            "🚫 Device limit reached."
        );


        return {
            success: false,
            allowed: false,
            existing: false,
            message:
                result.reason ||
                "This account is already registered on two devices. This device cannot be added."
        };

    }

    catch (error) {

        console.error(
            "❌ Device registration error:",
            error
        );


        // ----------------------------------------------------
        // IMPORTANT
        // ----------------------------------------------------
        //
        // DO NOT SIGN OUT.
        //
        // Authentication remains active.
        //
        // ----------------------------------------------------

        localStorage.setItem(
            DEVICE_ALLOWED_KEY,
            "false"
        );


        return {
            success: false,
            allowed: false,
            message:
                "Unable to verify this device right now. Please try again."
        };

    }

}


// ============================================================
// CHECK CURRENT DEVICE STATUS
// ============================================================

function isCurrentDeviceAllowed() {

    return (
        localStorage.getItem(
            DEVICE_ALLOWED_KEY
        ) === "true"
    );

}


// ============================================================
// CREATE STUDENT ACCOUNT
// ============================================================

async function createStudentAccount(
    name,
    email,
    password,
    mobile,
    college
) {

    try {

        // ----------------------------------------------------
        // CLEAN INPUT
        // ----------------------------------------------------

        name =
            String(name || "").trim();

        email =
            String(email || "")
                .trim()
                .toLowerCase();

        password =
            String(password || "");

        mobile =
            String(mobile || "").trim();

        college =
            String(college || "").trim();


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!name) {

            return {
                success: false,
                message:
                    "Please enter your full name."
            };

        }


        if (!mobile) {

            return {
                success: false,
                message:
                    "Please enter your mobile number."
            };

        }


        if (!college) {

            return {
                success: false,
                message:
                    "Please enter your college name."
            };

        }


        if (!email) {

            return {
                success: false,
                message:
                    "Please enter your email address."
            };

        }


        if (!password) {

            return {
                success: false,
                message:
                    "Please enter your password."
            };

        }


        if (password.length < 6) {

            return {
                success: false,
                message:
                    "Password must contain at least 6 characters."
            };

        }


        // ----------------------------------------------------
        // CREATE FIREBASE AUTH ACCOUNT
        // ----------------------------------------------------

        console.log(
            "Creating Firebase Auth account..."
        );


        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "✅ Firebase Auth account created:",
            user.uid
        );


        // ----------------------------------------------------
        // CREATE FIRESTORE STUDENT DOCUMENT
        // ----------------------------------------------------

        const studentRef =
            doc(
                db,
                "students",
                user.uid
            );


        await setDoc(
            studentRef,
            {

                uid:
                    user.uid,

                name:
                    name,

                email:
                    email,

                mobile:
                    mobile,

                college:
                    college,

                createdAt:
                    serverTimestamp(),

                accountStatus:
                    "pending",

                // ------------------------------------------------
                // KEEP EXISTING UNIT STRUCTURE COMPATIBLE
                // ------------------------------------------------

                approvedUnits: {

                    "unit-11":
                        false,

                    "unit-12":
                        false

                },

                // ------------------------------------------------
                // APPROVAL DATES
                // ------------------------------------------------

                approvalDates: {

                    "unit-11":
                        null,

                    "unit-12":
                        null

                },

                // ------------------------------------------------
                // DEVICE SYSTEM
                // ------------------------------------------------

                device1:
                    "",

                device2:
                    ""

            }
        );


        console.log(
            "✅ Student Firestore document created:",
            user.uid
        );


        // ----------------------------------------------------
        // LOGOUT AFTER REGISTRATION
        // ----------------------------------------------------

        await signOut(
            auth
        );


        console.log(
            "✅ Registration completed successfully."
        );


        return {

            success:
                true,

            message:
                "Account created successfully. Please wait for approval."

        };

    }

    catch (error) {

        console.error(
            "❌ Registration Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(
                    error
                )

        };

    }

}


// ============================================================
// LOGIN STUDENT
// ============================================================

async function loginStudent(
    email,
    password
) {

    try {

        // ----------------------------------------------------
        // CLEAN INPUT
        // ----------------------------------------------------

        email =
            String(email || "")
                .trim()
                .toLowerCase();

        password =
            String(password || "");


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!email) {

            return {
                success: false,
                message:
                    "Please enter your email address."
            };

        }


        if (!password) {

            return {
                success: false,
                message:
                    "Please enter your password."
            };

        }


        // ----------------------------------------------------
        // FIREBASE LOGIN
        // ----------------------------------------------------

        console.log(
            "Attempting Firebase login..."
        );


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "✅ Firebase login successful:",
            user.uid
        );


        // ----------------------------------------------------
        // GET STUDENT DOCUMENT
        // ----------------------------------------------------

        let studentData =
            null;


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
                studentSnap.exists()
            ) {

                studentData =
                    studentSnap.data();


                console.log(
                    "✅ Student document loaded."
                );

            }

            else {

                console.warn(
                    "⚠️ Student document does not exist."
                );

            }

        }

        catch (firestoreError) {

            console.error(
                "❌ Firestore student document error:",
                firestoreError
            );


            // IMPORTANT:
            // Authentication succeeded.
            // DO NOT automatically sign out.

        }


        // ----------------------------------------------------
        // BLOCKED ACCOUNT
        // ----------------------------------------------------

        if (
            studentData &&
            studentData.accountStatus ===
                "blocked"
        ) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                message:
                    "Your account has been blocked. Please contact Shaheen Sir."

            };

        }


        // ----------------------------------------------------
        // DEVICE REGISTRATION
        // ----------------------------------------------------
        //
        // IMPORTANT:
        // If device 3 is detected, DO NOT sign out.
        //
        // ----------------------------------------------------

        if (studentData) {

            const deviceResult =
                await registerCurrentDevice(
                    user.uid
                );


            // ------------------------------------------------
            // THIRD DEVICE / DEVICE ERROR
            // ------------------------------------------------

            if (
                !deviceResult.allowed
            ) {

                console.warn(
                    "🚫 Current device is not allowed."
                );


                return {

                    success:
                        false,

                    deviceBlocked:
                        true,

                    user:
                        user,

                    student:
                        studentData,

                    message:
                        deviceResult.message

                };

            }

        }


        // ----------------------------------------------------
        // ACCOUNT STATUS
        // ----------------------------------------------------

        let message =
            "Login successful.";


        if (
            studentData &&
            studentData.accountStatus ===
                "pending"
        ) {

            message =
                "Login successful. Your account is waiting for approval.";

        }


        if (
            studentData &&
            studentData.accountStatus ===
                "active"
        ) {

            message =
                "Login successful. Welcome back.";

        }


        // ----------------------------------------------------
        // RETURN LOGIN RESULT
        // ----------------------------------------------------

        return {

            success:
                true,

            message:
                message,

            user:
                user,

            student:
                studentData,

            deviceAllowed:
                true

        };

    }

    catch (error) {

        console.error(
            "❌ Login Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(
                    error
                )

        };

    }

}


// ============================================================
// PASSWORD RESET
// ============================================================

async function resetStudentPassword(
    email
) {

    try {

        email =
            String(email || "")
                .trim()
                .toLowerCase();


        if (!email) {

            return {

                success:
                    false,

                message:
                    "Please enter your email address."

            };

        }


        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success:
                true,

            message:
                "Password reset email has been sent. Please check your inbox."

        };

    }

    catch (error) {

        console.error(
            "❌ Password Reset Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(
                    error
                )

        };

    }

}


// ============================================================
// LOGOUT STUDENT
// ============================================================

async function logoutStudent() {

    try {

        await signOut(
            auth
        );


        localStorage.removeItem(
            DEVICE_ALLOWED_KEY
        );


        console.log(
            "✅ Student logged out."
        );


        return {

            success:
                true,

            message:
                "Logged out successfully."

        };

    }

    catch (error) {

        console.error(
            "❌ Logout Error:",
            error
        );


        return {

            success:
                false,

            message:
                "Unable to logout."

        };

    }

}


// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {

    return auth.currentUser;

}


// ============================================================
// WATCH AUTH STATE
// ============================================================

function watchAuthState(
    callback
) {

    return onAuthStateChanged(
        auth,
        callback
    );

}


// ============================================================
// FRIENDLY FIREBASE ERROR
// ============================================================

function getFriendlyAuthError(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/email-already-in-use":

            return (
                "This email is already registered. " +
                "Please use Login instead."
            );


        case "auth/invalid-email":

            return (
                "Please enter a valid email address."
            );


        case "auth/weak-password":

            return (
                "Password must contain at least 6 characters."
            );


        case "auth/password-does-not-meet-requirements":

            return (
                "Password does not meet the required security rules."
            );


        case "auth/invalid-credential":

            return (
                "Incorrect email or password."
            );


        case "auth/user-not-found":

            return (
                "No account was found with this email."
            );


        case "auth/wrong-password":

            return (
                "Incorrect email or password."
            );


        case "auth/too-many-requests":

            return (
                "Too many attempts. Please wait and try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network problem. Please check your internet connection."
            );


        case "auth/user-disabled":

            return (
                "This account has been disabled."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/password authentication is not enabled in Firebase."
            );


        case "permission-denied":

        case "firestore/permission-denied":

            return (
                "Account authentication succeeded, " +
                "but Firestore permission was denied. " +
                "Please check the Firestore Rules."
            );


        case "failed-precondition":

        case "firestore/failed-precondition":

            return (
                "Firebase could not complete this operation. " +
                "Please check your Firebase configuration."
            );


        case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":

            return (
                "Firebase API key is invalid. " +
                "Please check firebase-config.js."
            );


        case "auth/app-deleted":

            return (
                "Firebase application configuration is invalid."
            );


        default:

            return (
                error?.message ||
                "Something went wrong. Please try again."
            );

    }

}


// ============================================================
// EXPORT
// ============================================================

export {

    auth,

    db,

    createStudentAccount,

    loginStudent,

    registerCurrentDevice,

    isCurrentDeviceAllowed,

    resetStudentPassword,

    logoutStudent,

    getCurrentUser,

    watchAuthState

};


// ============================================================
// END OF FIREBASE AUTHENTICATION
// ============================================================
