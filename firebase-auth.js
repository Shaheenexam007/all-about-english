```javascript
// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE AUTHENTICATION
// DEVICE LIMIT: MAXIMUM 2 DEVICES PER ACCOUNT
// BY SHAHEEN SIR
// ============================================================


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { app } from "./firebase-config.js";


import {
    getDeviceId
} from "./device-manager.js";


// ============================================================
// INITIALIZE
// ============================================================

const auth =
    getAuth(app);


const db =
    getFirestore(app);


// ============================================================
// DEVICE LIMIT
// ============================================================
//
// 1 account = maximum 2 devices
//
// Firestore student document:
//
// device1: "DEVICE_ID"
// device2: "DEVICE_ID"
//
// ============================================================

const MAX_DEVICES = 2;


// ============================================================
// REGISTER STUDENT
// ============================================================

async function registerStudent(
    name,
    mobile,
    email,
    college,
    password
) {

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // ----------------------------------------------------
        // Get current device ID
        // ----------------------------------------------------

        const deviceId =
            getDeviceId();


        console.log(
            "Registration device ID:",
            deviceId
        );


        // ----------------------------------------------------
        // Create student document
        // ----------------------------------------------------

        await setDoc(
            doc(
                db,
                "students",
                user.uid
            ),
            {

                uid:
                    user.uid,

                name:
                    name,

                mobile:
                    mobile,

                email:
                    email,

                college:
                    college,

                createdAt:
                    serverTimestamp(),

                accountStatus:
                    "pending",

                // ------------------------------------------------
                // Device slots
                // ------------------------------------------------

                device1:
                    "",

                device2:
                    ""

            }
        );


        // ----------------------------------------------------
        // Logout immediately after registration
        // ----------------------------------------------------

        await signOut(
            auth
        );


        return {

            success:
                true,

            message:
                "Account created successfully."

        };

    }

    catch (error) {

        console.error(
            "Registration Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(error)

        };

    }

}


// ============================================================
// CHECK / REGISTER DEVICE
// ============================================================
//
// Returns:
//
// {
//     allowed: true
// }
//
// OR
//
// {
//     allowed: false,
//     reason: "limit"
// }
//
// ============================================================

async function checkAndRegisterDevice(
    user
) {

    if (!user) {

        return {

            allowed:
                false,

            reason:
                "no-user"

        };

    }


    const deviceId =
        getDeviceId();


    console.log(
        "Current device ID:",
        deviceId
    );


    const studentRef =
        doc(
            db,
            "students",
            user.uid
        );


    try {

        const result =
            await runTransaction(
                db,
                async function(transaction) {

                    const studentSnap =
                        await transaction.get(
                            studentRef
                        );


                    // ------------------------------------------------
                    // Student document missing
                    // ------------------------------------------------

                    if (
                        !studentSnap.exists()
                    ) {

                        return {

                            allowed:
                                false,

                            reason:
                                "student-not-found"

                        };

                    }


                    const data =
                        studentSnap.data();


                    // ------------------------------------------------
                    // Existing device slots
                    // ------------------------------------------------

                    const device1 =
                        String(
                            data.device1 || ""
                        ).trim();


                    const device2 =
                        String(
                            data.device2 || ""
                        ).trim();


                    // ------------------------------------------------
                    // DEVICE ALREADY REGISTERED
                    // ------------------------------------------------
                    //
                    // Same browser/device can login normally.
                    //
                    // ------------------------------------------------

                    if (
                        device1 === deviceId ||
                        device2 === deviceId
                    ) {

                        return {

                            allowed:
                                true,

                            reason:
                                "existing-device"

                        };

                    }


                    // ------------------------------------------------
                    // FIRST DEVICE
                    // ------------------------------------------------

                    if (!device1) {

                        transaction.update(
                            studentRef,
                            {

                                device1:
                                    deviceId,

                                device1LastLogin:
                                    serverTimestamp()

                            }
                        );


                        return {

                            allowed:
                                true,

                            reason:
                                "device-1"

                        };

                    }


                    // ------------------------------------------------
                    // SECOND DEVICE
                    // ------------------------------------------------

                    if (!device2) {

                        transaction.update(
                            studentRef,
                            {

                                device2:
                                    deviceId,

                                device2LastLogin:
                                    serverTimestamp()

                            }
                        );


                        return {

                            allowed:
                                true,

                            reason:
                                "device-2"

                        };

                    }


                    // ------------------------------------------------
                    // THIRD DEVICE
                    // ------------------------------------------------
                    //
                    // Both device slots are already occupied.
                    //
                    // ------------------------------------------------

                    return {

                        allowed:
                            false,

                        reason:
                            "limit"

                    };

                }
            );


        console.log(
            "Device check result:",
            result
        );


        return result;

    }

    catch (error) {

        console.error(
            "Device registration/check error:",
            error
        );


        // ----------------------------------------------------
        // SECURITY PRINCIPLE
        // ----------------------------------------------------
        //
        // If device verification cannot be completed,
        // do NOT allow the login.
        //
        // ----------------------------------------------------

        return {

            allowed:
                false,

            reason:
                "verification-error",

            error:
                error

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
        // STEP 1
        // Firebase Authentication
        // ----------------------------------------------------

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "Firebase login successful:",
            user.uid
        );


        // ----------------------------------------------------
        // STEP 2
        // Read student document
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

            }

        }

        catch (firestoreError) {

            console.error(
                "Student document read error:",
                firestoreError
            );


            // ------------------------------------------------
            // IMPORTANT
            // ------------------------------------------------
            //
            // Device security cannot be verified if the
            // student document cannot be read.
            //
            // Therefore logout and block access.
            //
            // ------------------------------------------------

            await signOut(
                auth
            );


            return {

                success:
                    false,

                message:
                    "Unable to verify your account. Please try again."

            };

        }


        // ----------------------------------------------------
        // STEP 3
        // Student document must exist
        // ----------------------------------------------------

        if (!studentData) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                message:
                    "Student account information was not found. Please contact Shaheen Sir."

            };

        }


        // ----------------------------------------------------
        // STEP 4
        // Account status
        // ----------------------------------------------------

        if (
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
        // STEP 5
        // DEVICE SECURITY
        // ----------------------------------------------------

        const deviceResult =
            await checkAndRegisterDevice(
                user
            );


        // ----------------------------------------------------
        // DEVICE LIMIT REACHED
        // ----------------------------------------------------

        if (
            !deviceResult.allowed
        ) {

            await signOut(
                auth
            );


            // ------------------------------------------------
            // Third device
            // ------------------------------------------------

            if (
                deviceResult.reason ===
                "limit"
            ) {

                return {

                    success:
                        false,

                    message:
                        "Device limit reached. This account is already active on 2 devices. Please log out from one of your existing devices or contact Shaheen Sir."

                };

            }


            // ------------------------------------------------
            // Other verification error
            // ------------------------------------------------

            return {

                success:
                    false,

                message:
                    "Unable to verify this device. Please try again or contact Shaheen Sir."

            };

        }


        // ----------------------------------------------------
        // STEP 6
        // Successful login
        // ----------------------------------------------------

        console.log(
            "Device access granted:",
            deviceResult.reason
        );


        return {

            success:
                true,

            message:
                studentData &&
                studentData.accountStatus ===
                "pending"

                ? "Login successful. Your account is waiting for approval."

                : "Login successful.",

            user:
                user,

            student:
                studentData

        };

    }

    catch (error) {

        console.error(
            "Login Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(error)

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
            "Password Reset Error:",
            error
        );


        return {

            success:
                false,

            message:
                getFriendlyAuthError(error)

        };

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutStudent() {

    try {

        // ----------------------------------------------------
        // IMPORTANT:
        //
        // We DO NOT remove device1/device2 during logout.
        //
        // Otherwise a student could:
        //
        // Login → logout → new device → login
        //
        // and bypass the 2-device limit.
        //
        // ----------------------------------------------------

        await signOut(
            auth
        );


        return {

            success:
                true

        };

    }

    catch (error) {

        console.error(
            "Logout Error:",
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
// CURRENT USER
// ============================================================

function getCurrentUser() {

    return auth.currentUser;

}


// ============================================================
// AUTH STATE
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
// FRIENDLY ERROR MESSAGE
// ============================================================

function getFriendlyAuthError(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/email-already-in-use":

            return "This email is already registered. Please use Login instead.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Password must contain at least 6 characters.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/user-not-found":

            return "No account was found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait and try again later.";


        case "auth/network-request-failed":

            return "Network problem. Please check your internet connection.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        case "auth/operation-not-allowed":

            return "Email/password authentication is not enabled.";


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

    registerStudent,

    loginStudent,

    resetStudentPassword,

    logoutStudent,

    getCurrentUser,

    watchAuthState,

    checkAndRegisterDevice

};
```
