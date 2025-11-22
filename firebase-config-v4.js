// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app"; // removed to avoid bare specifier
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase Configuration
// ✅ Config from Firebase Console

export const firebaseConfig = {
    apiKey: "AIzaSyC4YZNq7ZustxRc1p8lawTrSX5jjFduRro",
    authDomain: "stock-counting-37d5c.firebaseapp.com",
    projectId: "stock-counting-37d5c",
    storageBucket: "stock-counting-37d5c.firebasestorage.app",
    messagingSenderId: "827380766530",
    appId: "1:827380766530:web:84b2b4594967b92e6b5adb"
};

// Database Collections
export const COLLECTIONS = {
    STOCK: 'stock',
    COUNT_RECORDS: 'countRecords',
    CONFIG: 'config'
};

// Config - เปลี่ยนเป็น true เมื่อพร้อมใช้ Firebase
export const USE_FIREBASE = true; // ✅ เปิดใช้งาน Firebase แล้ว!
export const USE_GOOGLE_SHEETS = false; // ปิด Google Sheets (ใช้ Firebase แทน)

console.log('✓ Firebase config loaded');

// Initialize Firebase
// const app = initializeApp(firebaseConfig); // initialization moved to index.html