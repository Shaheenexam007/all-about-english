// ============================================================
// ALL ABOUT ENGLISH
// FIREBASE AUTHENTICATION
// BY SHAHEEN SIR
// ============================================================
console.log("🔥 NEW firebase-auth.js LOADED — createStudentAccount VERSION");

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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE APP
// ============================================================

import {
    app
} from "./firebase-config.js";


// ============================================================
// INITIALIZE
// ============================================================

const auth = getAuth(app);

const db = getFirestore(app);


```javascript
// ============================================================
// CREATE STUDENT ACCOUNT
// ============================================================

async function createStudentAccount(
    name,
    email,
    password
) {

    try {

        // ----------------------------------------------------
        // CREATE FIREBASE AUTH ACCOUNT
        // ----------------------------------------------------

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;


        // ----------------------------------------------------
        // CREATE STUDENT FIRESTORE DOCUMENT
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

                email:
                    email,

                mobile:
                    "",

                college:
                    "",

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


        // ----------------------------------------------------
        // LOGOUT AFTER REGISTRATION
        // ----------------------------------------------------

        await signOut(
            auth
        );


        return {

            success:
                true,

            message:
                "Account created successfully. Please wait for admin approval."

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
```



// ============================================================
// LOGIN STUDENT
// ============================================================

async function loginStudent(
    email,
    password
) {

    try {

        // ----------------------------------------------------
        // FIREBASE LOGIN
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

            }

        }

        catch (firestoreError) {

            console.error(
                "Student document read error:",
                firestoreError
            );

            // Authentication succeeded.
            // DO NOT sign the user out here.

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
        // LOGIN MESSAGE
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


        return {

            success:
                true,

            message:
                message,

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
                true,

            message:
                "Logged out successfully."

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
// FRIENDLY AUTH ERROR
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

            return "Incorrect email or password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait and try again later.";


        case "auth/network-request-failed":

            return "Network problem. Please check your internet connection.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        case "auth/operation-not-allowed":

            return "Email/password authentication is not enabled in Firebase.";


        case "auth/password-does-not-meet-requirements":

            return "Password does not meet the required security rules.";


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

    resetStudentPassword,

    logoutStudent,

    getCurrentUser,

    watchAuthState

};
