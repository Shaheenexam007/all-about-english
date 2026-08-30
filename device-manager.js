// ============================================================
// ALL ABOUT ENGLISH
// DEVICE MANAGEMENT
// BY SHAHEEN SIR
// ============================================================


// ============================================================
// DEVICE ID KEY
// ============================================================

const DEVICE_ID_KEY =
    "all_about_english_device_id";


// ============================================================
// CREATE DEVICE ID
// ============================================================

function createDeviceId() {

    // --------------------------------------------------------
    // Try browser crypto UUID
    // --------------------------------------------------------

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return window.crypto.randomUUID();

    }


    // --------------------------------------------------------
    // Fallback
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // First visit on this browser
    // --------------------------------------------------------

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
// EXPORT
// ============================================================

export {

    getDeviceId,

    removeLocalDeviceId

};
