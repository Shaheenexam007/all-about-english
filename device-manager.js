// ============================================================
// ALL ABOUT ENGLISH
// DEVICE MANAGEMENT
// MAXIMUM 2 DEVICES PER ACCOUNT
// BY SHAHEEN SIR
// ============================================================

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
// SETTINGS
// ============================================================

const MAX_DEVICES = 2;

const DEVICE_ID_KEY =
    "all_about_english_device_id";


// ============================================================
// CREATE DEVICE ID
// ============================================================

function createDeviceId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        "device-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 15)
    );

}


// ============================================================
// GET DEVICE ID
// ============================================================

function getDeviceId() {

    let deviceId =
        localStorage.getItem(
            DEVICE_ID_KEY
        );


    if (!deviceId) {

        deviceId =
            createDeviceId();


        localStorage.setItem(
            DEVICE_ID_KEY,
            deviceId
        );

    }


    return deviceId;

}


// ============================================================
// REMOVE LOCAL DEVICE ID
// ============================================================

function removeLocalDeviceId() {

    localStorage.removeItem(
        DEVICE_ID_KEY
    );

}


// ============================================================
// CHECK / REGISTER DEVICE
// ============================================================

async function checkDeviceAccess() {

    const user =
        auth.currentUser;


    // --------------------------------------------------------
    // No login
    // --------------------------------------------------------

    if (!user) {

        return {
            allowed: false,
            reason: "not-logged-in"
        };

    }


    const deviceId =
        getDeviceId();


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

        return {
            allowed: false,
            reason: "student-not-found"
        };

    }


    const student =
        studentSnap.data();


    // --------------------------------------------------------
    // Existing devices
    // --------------------------------------------------------

    const devices =
        Array.isArray(
            student.registeredDevices
        )
            ? student.registeredDevices
            : [];


    // --------------------------------------------------------
    // Current device already registered
    // --------------------------------------------------------

    if (
        devices.includes(
            deviceId
        )
    ) {

        return {
            allowed: true,
            reason: "device-already-registered",
            deviceId: deviceId,
            deviceCount: devices.length
        };

    }


    // --------------------------------------------------------
    // Maximum device limit reached
    // --------------------------------------------------------

    if (
        devices.length >=
        MAX_DEVICES
    ) {

        return {
            allowed: false,
            reason: "device-limit-reached",
            deviceId: deviceId,
            deviceCount: devices.length,
            maxDevices: MAX_DEVICES
        };

    }


    // --------------------------------------------------------
    // Register new device
    // --------------------------------------------------------

    await updateDoc(
        studentRef,
        {

            registeredDevices:
                arrayUnion(
                    deviceId
                )

        }
    );


    return {
        allowed: true,
        reason: "new-device-registered",
        deviceId: deviceId,
        deviceCount:
            devices.length + 1
    };

}


// ============================================================
// EXPORT
// ============================================================

export {

    getDeviceId,

    removeLocalDeviceId,

    checkDeviceAccess,

    MAX_DEVICES

};
