# 🔥 Firebase Setup Guide - คู่มือติดตั้ง Firebase

## ขั้นตอนที่ 1: สร้าง Firebase Project

### 1.1 ไปที่ Firebase Console
1. เปิด [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Login ด้วย Google Account
3. กดปุ่ม **"Add project"** หรือ **"เพิ่มโปรเจ็กต์"**

### 1.2 สร้าง Project
1. **ชื่อ Project:** `stock-counting` (หรือชื่อที่คุณต้องการ)
2. กด **Continue**
3. **Google Analytics:** ปิดได้ (ไม่จำเป็น) หรือเปิดก็ได้
4. กด **Create project**
5. รอสักครู่... เสร็จแล้วกด **Continue**

---

## ขั้นตอนที่ 2: เพิ่ม Web App

### 2.1 Register App
1. ใน Firebase Console คลิกที่ **เว็บ** `</>`
2. **App nickname:** `Stock Counting Web`
3. ✅ เลือก **"Also set up Firebase Hosting"** (ถ้าต้องการ deploy)
4. กด **Register app**

### 2.2 คัดลอก Config
จะได้โค้ดประมาณนี้:

```javascript
const firebaseConfig = {
  apiKey: "AIza...xxxxxxxxx",
  authDomain: "stock-counting.firebaseapp.com",
  projectId: "stock-counting",
  storageBucket: "stock-counting.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxx"
};
```

**⚠️ เก็บไว้! จะใส่ในไฟล์ `firebase-config.js` ทีหลัง**

---

## ขั้นตอนที่ 3: เปิดใช้งาน Firestore Database

### 3.1 สร้าง Database
1. ใน Firebase Console ไปที่ **Build** → **Firestore Database**
2. กดปุ่ม **Create database**
3. เลือก **Location:** `asia-southeast1 (Singapore)` (ใกล้ไทยที่สุด)
4. **Security rules:** เลือก **"Start in test mode"** (ชั่วคราว)
5. กด **Enable**

### 3.2 ตั้งค่า Security Rules (สำคัญ!)

ไปที่ **Rules** tab แล้ววาง:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read for everyone
    match /stock/{document=**} {
      allow read: if true;
    }
    
    // Allow write only for authenticated users (or everyone for testing)
    match /countRecords/{document=**} {
      allow read, write: if true; // เปลี่ยนเป็น if request.auth != null ถ้าต้องการ login
    }
    
    // Admin only
    match /config/{document=**} {
      allow read: if true;
      allow write: if false; // เปลี่ยนเป็น if request.auth.token.admin == true
    }
  }
}
```

กด **Publish**

---

## ขั้นตอนที่ 4: เปิดใช้งาน Authentication (Optional แต่แนะนำ)

### 4.1 Enable Auth
1. ไปที่ **Build** → **Authentication**
2. กดปุ่ม **Get started**
3. เลือก **Sign-in method**

### 4.2 เลือก Provider
**แนะนำสำหรับระบบนี้:**

#### **วิธีที่ 1: Anonymous** (ง่ายที่สุด - ใช้รหัสพนักงานแบบเดิม)
1. เลือก **Anonymous**
2. เปิดใช้งาน → **Save**

#### **วิธีที่ 2: Email/Password** (ถ้าต้องการ login)
1. เลือก **Email/Password**
2. เปิดใช้งาน → **Save**
3. ไปที่ **Users** tab
4. กด **Add user**
5. ใส่ Email/Password สำหรับ Manager

---

## ขั้นตอนที่ 5: ใส่ Config ในโค้ด

### 5.1 สร้างไฟล์ `firebase-config.js`

ในโฟลเดอร์ `/Users/astronien/Desktop/stock/` สร้างไฟล์นี้:

```javascript
// Firebase Configuration
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // ← ใส่จากขั้นตอนที่ 2.2
  authDomain: "YOUR_AUTH_DOMAIN",      // ← ใส่จากขั้นตอนที่ 2.2
  projectId: "YOUR_PROJECT_ID",        // ← ใส่จากขั้นตอนที่ 2.2
  storageBucket: "YOUR_STORAGE_BUCKET", // ← ใส่จากขั้นตอนที่ 2.2
  messagingSenderId: "YOUR_SENDER_ID", // ← ใส่จากขั้นตอนที่ 2.2
  appId: "YOUR_APP_ID"                 // ← ใส่จากขั้นตอนที่ 2.2
};
```

**⚠️ แทนที่ `YOUR_*` ด้วยค่าจริงจากขั้นตอนที่ 2.2**

---

## ขั้นตอนที่ 6: ทดสอบการเชื่อมต่อ

### 6.1 เปิดเว็บ
1. เปิด `http://localhost:8000`
2. เปิด Browser Console (F12)
3. ดูว่ามี error หรือไม่

### 6.2 ทดสอบ Import
1. Download ไฟล์ CSV ตัวอย่าง (จะมีให้)
2. ไปที่หน้า **Import ข้อมูล**
3. อัพโหลดไฟล์
4. กด **Import**
5. ตรวจสอบใน Firebase Console → Firestore Database

---

## 📋 Checklist

Setup เสร็จหรือยัง:

- [ ] สร้าง Firebase Project แล้ว
- [ ] เพิ่ม Web App แล้ว
- [ ] ได้ Firebase Config แล้ว (firebaseConfig)
- [ ] เปิด Firestore Database แล้ว
- [ ] ตั้งค่า Security Rules แล้ว
- [ ] (Optional) เปิด Authentication แล้ว
- [ ] สร้างไฟล์ `firebase-config.js` แล้ว
- [ ] ใส่ config ถูกต้องแล้ว

---

## 🆘 แก้ปัญหา

### ❌ "Firebase not defined"
- ตรวจสอบว่าเพิ่ม script tags ใน `index.html` แล้ว
- ตรวจสอบ internet connection

### ❌ "Permission denied"
- ตรวจสอบ Security Rules
- เปลี่ยนเป็น `allow read, write: if true;` ชั่วคราว

### ❌ "Failed to fetch"
- ตรวจสอบ Firebase Config ถูกต้องหรือไม่
- ตรวจสอบ Project ID

---

## 🎯 ขั้นตอนถัดไป

หลัง Setup เสร็จ:
1. ✅ Import ข้อมูลจาก Google Sheets
2. ✅ ทดสอบการสแกน
3. ✅ ทดสอบ Real-time sync
4. ✅ Deploy ขึ้น Firebase Hosting (optional)

---

## 📞 ต้องการความช่วยเหลือ?

ถ้ามีปัญหาตรงไหน:
1. เช็ค Browser Console (F12)
2. เช็ค Firebase Console → Firestore → Data
3. ดูไฟล์ `FIREBASE_TROUBLESHOOTING.md`

**เสร็จแล้วดำเนินการต่อขั้นตอนการ Import ข้อมูล! 🚀**
