import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBZarYqkH-OXCxQT_ykUmmv7ssjWvIjr-c",
    authDomain: "sistema-parqueo-ucad.firebaseapp.com",
    projectId: "sistema-parqueo-ucad",
    storageBucket: "sistema-parqueo-ucad.firebasestorage.app",
    messagingSenderId: "800245062079",
    appId: "1:800245062079:web:8cf177736b22bc3049290a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);