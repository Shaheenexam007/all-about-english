import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


const firebaseConfig = {

    apiKey:
        "AIzaSyB6xJFLJC9KReEJQAzHbOmB67DBg-zX4gE",

    authDomain:
        "all-about-english-007.firebaseapp.com",

    databaseURL:
        "https://all-about-english-007-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "all-about-english-007",

    storageBucket:
        "all-about-english-007.firebasestorage.app",

    messagingSenderId:
        "251678333411",

    appId:
        "1:251678333411:web:889369210cb79442f0a8d6",

    measurementId:
        "G-RVFY5YEX6L"

};


const app = initializeApp(firebaseConfig);


export { app };
