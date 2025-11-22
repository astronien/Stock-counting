# 🚀 Deploy to Firebase Hosting

## ขั้นตอนการ Deploy

### 1. ติดตั้ง Firebase CLI

```bash
# ติดตั้ง Firebase tools
npm install -g firebase-tools

# หรือถ้ามี npm แล้ว
sudo npm install -g firebase-tools
```

### 2. Login เข้า Firebase

```bash
firebase login
```

เบราว์เซอร์จะเปิดขึ้นให้ login ด้วย Google Account ที่สร้าง Firebase Project

### 3. Initialize Firebase Project

```bash
cd /Users/astronien/Desktop/stock

# Link กับ Firebase Project ที่มีอยู่
firebase init hosting
```

**ตอบคำถามดังนี้:**
```
? What do you want to use as your public directory? 
→ . (current directory)

? Configure as a single-page app (rewrite all urls to /index.html)? 
→ No

? Set up automatic builds and deploys with GitHub? 
→ No

? File index.html already exists. Overwrite? 
→ No
```

### 4. Deploy!

```bash
firebase deploy --only hosting
```

รอสักครู่... เสร็จ! ✅

### 5. เข้าถึงเว็บไซต์

```
https://YOUR-PROJECT-ID.web.app
หรือ
https://YOUR-PROJECT-ID.firebaseapp.com
```

---

## 🎯 Quick Deploy (One Command)

```bash
# Deploy ทันทีถ้า setup เรียบร้อยแล้ว
cd /Users/astronien/Desktop/stock && firebase deploy --only hosting
```

---

## 📋 Pre-Deployment Checklist

### ✅ ก่อน Deploy ให้เช็ค:

```bash
[✓] Firebase Project สร้างแล้ว
[✓] firebase-config.js ใส่ค่าถูกต้อง
[✓] USE_FIREBASE = true
[✓] Firestore Database เปิดใช้งาน
[✓] Firestore Rules ตั้งค่าแล้ว
[✓] ทดสอบบน localhost ผ่าน
```

---

## 🔧 Troubleshooting

### Error: "Firebase command not found"
```bash
# ติดตั้ง Firebase CLI
npm install -g firebase-tools

# หรือ
sudo npm install -g firebase-tools
```

### Error: "Permission denied"
```bash
# ใช้ sudo
sudo npm install -g firebase-tools
```

### Error: "Project not found"
```bash
# Login ใหม่
firebase logout
firebase login

# Init ใหม่
firebase init hosting
```

---

## 🎨 Custom Domain (Optional)

### ถ้าต้องการใช้ Domain เป็นของตัวเอง:

```bash
1. ไป Firebase Console
2. Hosting → Add custom domain
3. ใส่ domain name (เช่น stock.example.com)
4. ตั้งค่า DNS records ตามที่ Firebase บอก
5. รอ SSL certificate (24-48 ชั่วโมง)
6. เสร็จ!
```

---

## 📊 After Deployment

### ตรวจสอบว่า Deploy สำเร็จ:

```bash
# เปิดเว็บไซต์
firebase open hosting:site

# ดู deployment history
firebase hosting:log
```

### ทดสอบฟีเจอร์:

```
1. เปิด https://YOUR-PROJECT.web.app
2. ทดสอบ Import (import.html)
3. ทดสอบ Dashboard (dashboard.html)
4. ทดสอบ Stock Counting (index.html)
5. ทดสอบ Real-time sync (เปิด 2 browsers)
```

---

## 🔄 Redeploy (อัพเดทเว็บ)

### เมื่อแก้ไขโค้ด:

```bash
# Deploy version ใหม่
firebase deploy --only hosting

# หรือ deploy ทุกอย่าง
firebase deploy
```

### Rollback (ย้อนกลับ):

```bash
# ดู deployment history
firebase hosting:rollback

# เลือก version ที่ต้องการย้อนกลับ
```

---

## 💰 Hosting Quotas (Free Tier)

```
Firebase Hosting Free Tier:
- 10 GB storage
- 360 MB/day bandwidth
- SSL certificate (free)
- Custom domain (free)

ประมาณการ:
- โปรเจกต์นี้: ~5-10 MB
- 100 users/day: ~500 MB bandwidth
- ✓ ใช้ Free tier ได้สบาย!
```

---

## 🌐 URLs After Deployment

### Public URLs:
```
Main App:
https://YOUR-PROJECT.web.app

Dashboard:
https://YOUR-PROJECT.web.app/dashboard.html

Import:
https://YOUR-PROJECT.web.app/import.html
```

### แชร์กับทีม:
```
ส่ง URL ให้พนักงาน
- เข้าได้จากทุกที่ (มีเน็ต)
- ไม่ต้อง VPN
- ทำงานบนมือถือ
- ติดตั้งเป็น PWA ได้
```

---

## 📱 PWA Installation (After Deploy)

### บนมือถือ (iOS/Android):
```
1. เปิด https://YOUR-PROJECT.web.app
2. คลิก "Add to Home Screen"
3. ใช้งานเหมือน Native App!
```

### บน Desktop:
```
1. เปิด Chrome
2. ไปที่ URL
3. คลิก ⊕ ใน Address bar
4. "Install Stock Counting System"
```

---

## 🔒 Security After Deployment

### แนะนำให้ทำ:

```bash
1. เปิดใช้ Firebase Authentication
   - Anonymous auth (ง่าย)
   - หรือ Email/Password

2. อัพเดท Firestore Rules:
   - อ่าน: ต้อง authenticated
   - เขียน: ต้องมี role

3. ตั้งค่า CORS
   - อนุญาตเฉพาะ domain ของคุณ

4. Enable Analytics
   - ดูว่ามีคนใช้เท่าไหร่
   - พฤติกรรมการใช้งาน
```

---

## ✅ Post-Deployment Checklist

```bash
After deploy สำเร็จ:

[✓] เปิด URL ได้
[✓] แต่ละหน้าทำงานปกติ
[✓] Firebase connection ทำงาน
[✓] Import ใช้งานได้
[✓] Real-time sync ทำงาน
[✓] Dashboard แสดงข้อมูล
[✓] Mobile responsive
[✓] PWA installable
[✓] แชร์ URL ให้ทีม
[✓] เทสต์จากคนอื่น
```

---

## 🎉 Success!

**เว็บของคุณ live แล้ว!** 🚀

- ✅ เข้าถึงได้จากทุกที่
- ✅ HTTPS secure
- ✅ Fast & Reliable
- ✅ Auto-scaling
- ✅ Free hosting

**Happy Deploying! 🎊**
