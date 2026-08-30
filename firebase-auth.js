// ============================================================
// ALL ABOUT ENGLISH
// Firebase Authentication
// By Shaheen Sir
// ============================================================

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app } from "./firebase-config.js";


// ============================================================
// INITIALIZE
// ============================================================

const auth = getAuth(app);

const db = getFirestore(app);


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

        // -----------------------------------------------
        // Create Firebase Authentication account
        // -----------------------------------------------

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // -----------------------------------------------
        // Create student Firestore document
        // -----------------------------------------------

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

                device1:
                    "",

                device2:
                    ""

            }
        );


        // -----------------------------------------------
        // Sign out after registration
        // -----------------------------------------------

        await signOut(auth);


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
                getFriendlyAuthError(
                    error
                )

        };

    }

}



// ============================================================
// STUDENT LOGIN
// ============================================================

async function loginStudent(
    email,
    password
) {

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // -----------------------------------------------
        // Get student document
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Student document missing
        // -----------------------------------------------

        if (!studentSnap.exists()) {

            await signOut(auth);


            return {

                success:
                    false,

                message:
                    "Student account information was not found."

            };

        }


        const studentData =
            studentSnap.data();


        // -----------------------------------------------
        // Account status
        // -----------------------------------------------

        if (
            studentData.accountStatus ===
            "blocked"
        ) {

            await signOut(auth);


            return {

                success:
                    false,

                message:
                    "Your account has been blocked. Please contact Shaheen Sir."

            };

        }


        if (
            studentData.accountStatus ===
            "pending"
        ) {

            // Login is allowed,
            // but protected content will remain locked.

            return {

                success:
                    true,

                message:
                    "Login successful. Your account is waiting for approval."

            };

        }


        // -----------------------------------------------
        // Active account
        // -----------------------------------------------

        return {

            success:
                true,

            message:
                "Login successful."

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

        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success:
                true,

            message:
                "Password reset email has been sent."

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
                getFriendlyAuthError(
                    error
                )

        };

    }

}



// ============================================================
// LOGOUT
// ============================================================

async function logoutStudent() {

    try {

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
// AUTH STATE LISTENER
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

            return "This email is already registered. Please login instead.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Password is too weak. Please use at least 6 characters.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/user-not-found":

            return "No account was found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait a while and try again.";


        case "auth/network-request-failed":

            return "Network problem. Please check your internet connection.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        case "auth/operation-not-allowed":

            return "Email/password authentication is not enabled in Firebase.";


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

    watchAuthState

};
