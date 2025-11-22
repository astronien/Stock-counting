# 🔥 Stock Counting System - Firebase Edition
## คู่มือการใช้งานฉบับสมบูรณ์

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [การติดตั้งและตั้งค่า](#การติดตั้งและตั้งค่า)
3. [Phase 1: Import System](#phase-1-import-system)
4. [Phase 2: Real-time Sync](#phase-2-real-time-sync)
5. [Phase 3: Manager Dashboard](#phase-3-manager-dashboard)
6. [วิธีใช้งาน](#วิธีใช้งาน)
7. [คำถามที่พบบ่อย](#คำถามที่พบบ่อย)

---

## 🎯 ภาพรวมระบบ

### **ระบบนับสต็อกแบบ Real-time** ประกอบด้วย:

```
┌──────────────────────────────────────────────┐
│                                              │
│  📤 Import Page                              │
│  ↓ อัพโหลด CSV/Excel                         │
│                                              │
│  🔥 Firebase Firestore (Real-time DB)        │
│  ↓ Auto-sync ทุกเครื่อง                      │
│                                              │
│  📱 Stock Counting Page                      │
│  ↓ พนักงานสแกน/กรอก S/N                      │
│                                              │
│  📊 Manager Dashboard                        │
│  ↓ Monitor + Analytics                       │
│                                              │
└──────────────────────────────────────────────┘
```

### **คุณสมบัติหลัก**
- ✅ **Real-time Sync**: ทุกคนเห็นข้อมูลพร้อมกัน
- ✅ **Offline Support**: ทำงานต่อได้แม้ไม่มีเน็ต
- ✅ **Multi-user**: รองรับหลายคนใช้พร้อมกัน
- ✅ **Easy Import**: อัพโหลด CSV/Excel ง่ายๆ
- ✅ **Analytics**: Dashboard สำหรับ Manager
- ✅ **Mobile Optimized**: ใช้งานได้ทั้ง PC และมือถือ

---

## 🛠️ การติดตั้งและตั้งค่า

### **ขั้นตอนที่ 1: Setup Firebase**

อ่านคู่มือ: [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)

```bash
1. สร้าง Firebase Project
2. เปิดใช้ Firestore Database
3. คัดลอก Config
4. วางใน firebase-config.js
5. ตั้งค่า Rules
```

### **ขั้นตอนที่ 2: เปิดใช้งาน Firebase**

แก้ไขไฟล์ `firebase-config.js`:

```javascript
// เปลี่ยนจาก
export const USE_FIREBASE = false;

// เป็น
export const USE_FIREBASE = true;
```

### **ขั้นตอนที่ 3: รัน Local Server**

```bash
cd /Users/astronien/Desktop/stock
python3 -m http.server 8000
```

เปิด Browser: `http://localhost:8000`

---

## 📤 Phase 1: Import System

### **วัตถุประสงค์**
ให้ Manager สามารถ Import ข้อมูล stock จาก Google Sheets (CSV/Excel) เข้า Firebase ได้ง่ายๆ

### **ไฟล์ที่เกี่ยวข้อง**
- `import.html` - หน้า Import
- `import.js` - Logic การ Import
- `sample_stock_data.csv` - ตัวอย่างข้อมูล

### **วิธีใช้งาน**

#### 1. เตรียมไฟล์ข้อมูล
```
Export จาก Google Sheets เป็น CSV
หรือ ใช้ไฟล์ sample_stock_data.csv
```

#### 2. เปิดหน้า Import
```
http://localhost:8000/import.html
```

#### 3. อัพโหลดไฟล์
```
- ลากไฟล์มาวาง หรือ คลิก "เลือกไฟล์"
- ระบบแสดง Preview 10 รายการแรก
```

#### 4. จับคู่ Column
```
- เลือก Column สำหรับ S/N
- เลือก Column สำหรับ Product Name
```

#### 5. Import
```
- คลิก "Import ข้อมูล"
- รอสักครู่...
- เสร็จ! ✓
```

### **ฟีเจอร์**
- ✅ รองรับ CSV, XLSX, XLS
- ✅ Drag & Drop
- ✅ Preview ข้อมูล
- ✅ Column Mapping
- ✅ Batch Import (500 รายการ/batch)
- ✅ Progress Bar
- ✅ ลบข้อมูลเดิมได้ (มี password)

---

## 🔥 Phase 2: Real-time Sync

### **วัตถุประสงค์**
ให้ระบบทำงานแบบ Real-time โดยใช้ Firebase แทน Google Sheets

### **ไฟล์ที่เกี่ยวข้อง**
- `app-firebase.js` - App version ใหม่
- `index.html` - อัพเดทให้ใช้ Firebase SDK

### **การทำงาน**

#### **Real-time Listeners**
```javascript
// Stock Data Listener
setupStockListener() {
  // ถ้ามีคนเพิ่ม/แก้ไข stock
  // → ทุกเครื่องได้รับข้อมูลใหม่ทันที
}

// Count Records Listener
setupCountListener() {
  // ถ้ามีคนสแกน S/N
  // → ทุกเครื่องเห็นประวัติทันที
}
```

#### **Workflow**
```
พนักงาน A สแกน S/N: 001
  ↓
บันทึกลง Firebase (Real-time)
  ↓
Firebase แจ้งเตือนทุกเครื่อง
  ↓
พนักงาน B,C,D,E เห็นอัพเดททันที!
```

### **ข้อดีของ Firebase**
| คุณสมบัติ | Google Sheets | Firebase |
|-----------|---------------|----------|
| Real-time | ❌ ต้อง refresh | ✅ อัตโนมัติ |
| ความเร็ว | 2-5 วินาที | < 100ms |
| Offline | ❌ | ✅ |
| Multi-user | ⚠️ ต้อง sync | ✅ อัตโนมัติ |

---

## 📊 Phase 3: Manager Dashboard

### **วัตถุประสงค์**
สร้าง Dashboard สำหรับ Manager ดู Analytics และ monitor ความคืบหน้าแบบ Real-time

### **ไฟล์ที่เกี่ยวข้อง**
- `dashboard.html` - หน้า Dashboard
- `dashboard.js` - Logic และ Charts

### **ฟีเจอร์**

#### **📊 Real-time Statistics**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ ✅ สแกนแล้ว │ ⏳ คงเหลือ  │ 📦 Stock    │ 👥 พนักงาน │
│    234      │    766      │   1,000     │     5       │
│ +15 วันนี้   │    76%      │  รายการ     │ คนที่ทำงาน │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### **📈 Progress Bar**
```
ความคืบหน้า                           23%
████████░░░░░░░░░░░░░░░░░░░░░░
234 / 1,000 รายการ
```

#### **📊 Charts**
- **Donut Chart**: สัดส่วน สแกน vs เหลือ
- **Bar Chart**: ประสิทธิภาพแต่ละพนักงาน

#### **🔴 Live Activity Feed**
```
● LIVE กิจกรรมล่าสุด

✅ พนักงาน A สแกน SN001
   2 วินาทีที่แล้ว
   
✅ พนักงาน B สแกน SN002
   1 นาทีที่แล้ว
```

#### **🏆 Top Performers**
```
🥇 พนักงาน A    50
🥈 พนักงาน B    45
🥉 พนักงาน C    40
```

#### **📋 Recent Scans**
- แสดง 50 รายการล่าสุด
- Real-time updates
- Export เป็น CSV ได้

---

## 📱 วิธีใช้งาน

### **สำหรับ Manager**

#### 1. Import ข้อมูล Stock (ครั้งแรก)
```
1. เปิด http://localhost:8000/import.html
2. อัพโหลด CSV/Excel
3. จับคู่ Column
4. Import
```

#### 2. Monitor ความคืบหน้า
```
1. เปิด http://localhost:8000/dashboard.html
2. ดูสถิติ real-time
3. เช็ก Top performers
4. Export รายงาน
```

### **สำหรับพนักงาน**

#### 1. เริ่มนับสต็อก
```
1. เปิด http://localhost:8000
2. กรอกรหัสพนักงาน
3. เลือกโหมด:
   - ⌨️ กรอก S/N ด้วยมือ
   - 📷 ใช้กล้องสแกน
```

#### 2. สแกนบาร์โค้ด
```
1. คลิก "ใช้กล้องสแกน"
2. เล็งกล้องที่บาร์โค้ด
3. ✓ สำเร็จ! บันทึกทันที
4. เห็นผลใน Dashboard real-time
```

#### 3. กรอกด้วยมือ
```
1. คลิก "กรอก S/N ด้วยมือ"
2. พิมพ์ S/N
3. กด Enter
4. ✓ สำเร็จ!
```

---

## 🎯 Use Cases

### **Scenario 1: เริ่มนับสต็อกใหม่**

```
Manager:
1. Reset Count (ถ้าจำเป็น)
2. Import ข้อมูล stock ใหม่
3. เปิด Dashboard ไว้ monitor

พนักงาน (5 คน):
1. เปิดหน้านับสต็อก
2. กรอกรหัสพนักงาน
3. เริ่มสแกน!

Manager:
- เห็นความคืบหน้า real-time
- เช็กว่าใครทำเร็วที่สุด
- Export รายงานเมื่อเสร็จ
```

### **Scenario 2: Monitor แบบ Real-time**

```
Manager เปิด Dashboard ตลอดเวลา
  ↓
พนักงาน A สแกน → Dashboard เห็นทันที
พนักงาน B สแกน → Dashboard เห็นทันที
พนักงาน C สแกน → Dashboard เห็นทันที
  ↓
ดูได้ว่า:
- คนไหนทำช้า ช่วยได้
- เร็วแค่ไหน เสร็จเมื่อไหร่
- มีปัญหาอะไรไหม
```

---

## ❓ คำถามที่พบบ่อย

### **Q1: ทำไม Dashboard ไม่เห็นข้อมูล?**
A: ตรวจสอบ:
1. Import ข้อมูล stock แล้วหรือยัง?
2. Firebase config ถูกต้องหรือไม่?
3. `USE_FIREBASE = true` หรือไม่?
4. เช็ก Browser Console (F12) มี error ไหม?

### **Q2: Real-time ไม่ทำงาน?**
A: ตรวจสอบ:
1. Firebase Rules อนุญาต read/write หรือไม่?
2. Internet connection ปกติหรือไม่?
3. เปิดหลาย browser ทดสอบดู

### **Q3: Import ล้มเหลว?**
A: ตรวจสอบ:
1. ไฟล์ CSV/Excel ถูกต้องหรือไม่?
2. มี Column S/N และ Product Name หรือไม่?
3. Firebase quota เหลืออยู่หรือไม่? (ดูที่ Firebase Console)

### **Q4: ต้องการลบข้อมูลเดิม?**
A:
```
1. เปิด import.html
2. คลิก "ลบข้อมูลเดิมทั้งหมด"
3. กรอก password: P12345678
4. ยืนยัน
```

### **Q5: Export รายงานได้ที่ไหน?**
A:
```
หน้าหลัก (index.html):
- Export ประวัติการนับ

Dashboard (dashboard.html):
- Export รายงานเต็ม (มี Summary + Top Performers)
```

### **Q6: รองรับกี่คน?**
A: ไม่จำกัด! แต่แนะนำ:
- **Free Tier Firebase**: 50K reads/day, 20K writes/day
- **ประมาณ**: 10-20 คนใช้พร้อมกันได้สบาย

### **Q7: ใช้ได้บนมือถือไหม?**
A: ได้! ออกแบบ Responsive
- สแกนได้ (ใช้กล้องมือถือ)
- Dashboard ดูได้ (แนะนำ tablet/iPad)

---

## 🔐 Security

### **Firebase Rules (Production)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Stock data - อ่านได้ทุกคน, เขียนได้เฉพาะ Manager
    match /stock/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'manager';
    }
    
    // Count records - อ่านได้ทุกคน, เขียนได้เฉพาะ authenticated
    match /countRecords/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### **แนะนำ (สำหรับ Production)**
1. เปิดใช้ Firebase Authentication
2. แยก role: manager, employee
3. ตั้งค่า Rules ตามตัวอย่างข้างบน
4. ใช้ HTTPS (ไม่ใช่ HTTP)

---

## 🚀 Performance Tips

### **1. Batch Import**
- Import ครั้งละ 500 รายการ
- ไม่ทำให้ Firebase ช้า

### **2. Real-time Optimization**
- ใช้ snapshot listeners
- Update เฉพาะที่เปลี่ยน

### **3. Chart Performance**
- Update mode: 'none' (ไม่มี animation)
- จำกัด data points

### **4. Offline Support**
- ใช้ localStorage cache
- Auto-sync เมื่อกลับมา online

---

## 📂 File Structure

```
/stock
├── index.html              # หน้านับสต็อก (พนักงาน)
├── dashboard.html          # Dashboard (Manager)
├── import.html             # หน้า Import
├── app-firebase.js         # App logic (Firebase)
├── dashboard.js            # Dashboard logic
├── import.js               # Import logic
├── firebase-config.js      # Firebase config
├── styles.css              # Styles ทั้งหมด
├── service-worker.js       # PWA support
├── manifest.json           # PWA config
├── sample_stock_data.csv   # ตัวอย่างข้อมูล
├── FIREBASE_SETUP.md       # คู่มือตั้งค่า Firebase
├── FIREBASE_QUICKSTART.md  # Quick start
├── PHASE1_COMPLETE.md      # Phase 1 guide  
├── PHASE2_COMPLETE.md      # Phase 2 guide
├── PHASE3_COMPLETE.md      # Phase 3 guide
└── USER_MANUAL.md          # คู่มือนี้
```

---

## 🎉 สรุป

### **ระบบครบครัน 3 Phases**

#### **Phase 1: Import System ✅**
- อัพโหลด CSV/Excel
- Preview + Column mapping
- Batch import

#### **Phase 2: Real-time Sync ✅**
- Firebase Firestore
- Real-time updates
- Offline support
- Multi-user

#### **Phase 3: Manager Dashboard ✅**
- Real-time statistics
- Charts & Graphs
- Activity feed
- Leaderboard
- Export reports

---

## 💡 ข้อแนะนำ

### **การใช้งานประจำวัน**
1. Manager เปิด Dashboard ไว้ตลอด
2. พนักงานใช้หน้านับสต็อก
3. Monitor real-time
4. Export รายงานเมื่อเสร็จ

### **Best Practices**
- Import ข้อมูลก่อนเริ่มนับ
- ตั้งรหัสพนักงานให้ชัดเจน
- Backup ข้อมูลจาก Firebaseเป็นระยะ
- เช็ค Dashboard บ่อยๆ

---

## 🆘 Support

### **หากมีปัญหา**
1. เช็ค Browser Console (F12)
2. อ่าน error message
3. ดูที่ Firebase Console
4. ติดต่อผู้พัฒนา

### **ติดต่อ**
- Email: support@example.com
- Line: @stockcount
- Tel: 02-XXX-XXXX

---

**เอกสารนี้อัพเดทล่าสุด: 22 พฤศจิกายน 2568**

© 2025 Stock Counting System - Firebase Edition
