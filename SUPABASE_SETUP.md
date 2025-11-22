# ⚡ Supabase Setup Guide - คู่มือติดตั้ง Supabase

## ขั้นตอนที่ 1: สร้าง Supabase Project

1.  ไปที่ [https://supabase.com/](https://supabase.com/)
2.  กด **"Start your project"**
3.  Login ด้วย GitHub (ถ้ามี) หรือสมัครใหม่
4.  กด **"New project"**
5.  กรอกข้อมูล:
    *   **Name:** `stock-counting`
    *   **Database Password:** (ตั้งรหัสผ่านที่จำได้ หรือกด Generate)
    *   **Region:** `Singapore (Southeast Asia)` (ใกล้ไทยที่สุด)
    *   **Pricing Plan:** Free
6.  กด **"Create new project"**
7.  รอสักครู่... (ประมาณ 1-2 นาที)

---

## ขั้นตอนที่ 2: สร้างตาราง (Database Tables)

เมื่อ Project สร้างเสร็จแล้ว:

1.  ไปที่เมนู **SQL Editor** (ไอคอนกระดาษทางซ้าย)
2.  กด **"New query"**
3.  Copy โค้ด SQL ด้านล่างไปวาง:

```sql
-- 1. สร้างตาราง Stock
CREATE TABLE stock (
  "serialNumber" TEXT PRIMARY KEY,
  "productName" TEXT,
  "importedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. สร้างตาราง Count Records (บันทึกการนับ)
CREATE TABLE count_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "serialNumber" TEXT NOT NULL,
  "productName" TEXT,
  "employeeId" TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. เปิด Row Level Security (RLS) แต่ Allow All (สำหรับ Internal App)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE count_records ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ Stock (อ่าน/เขียนได้ทุกคน)
CREATE POLICY "Enable all access for stock" ON stock
FOR ALL USING (true) WITH CHECK (true);

-- Policy สำหรับ Count Records (อ่าน/เขียนได้ทุกคน)
CREATE POLICY "Enable all access for count_records" ON count_records
FOR ALL USING (true) WITH CHECK (true);
```

4.  กดปุ่ม **Run** (สีเขียวขวาล่าง)
5.  ถ้าขึ้น "Success" แปลว่าสร้างตารางเสร็จแล้ว

---

## ขั้นตอนที่ 3: เอา Config มาใส่ในเว็บ

1.  ไปที่เมนู **Project Settings** (ไอคอนเฟือง) -> **API**
2.  หาหัวข้อ **Project URL** -> Copy **URL**
3.  หาหัวข้อ **Project API keys** -> Copy **anon** (public) key

### 3.1 ใส่ในไฟล์ `supabase-config.js`

เปิดไฟล์ `supabase-config.js` ในโปรเจคของคุณ แล้วแก้ค่า:

```javascript
export const SUPABASE_URL = "วาง URL ตรงนี้";
export const SUPABASE_ANON_KEY = "วาง anon key ตรงนี้";
```

---

## ขั้นตอนที่ 4: Deploy ขึ้น Vercel

1.  ไปที่ [https://vercel.com/](https://vercel.com/)
2.  สมัคร/Login
3.  กด **"Add New..."** -> **"Project"**
4.  เลือก **Import Git Repository** (ถ้าเอาโค้ดขึ้น GitHub แล้ว)
    *   หรือถ้ายัง ให้ติดตั้ง `vercel` CLI ในเครื่อง: `npm i -g vercel`
    *   แล้วพิมพ์คำสั่ง `vercel` ใน Terminal ของโปรเจค
5.  ทำตามขั้นตอน Deploy
6.  เสร็จ! 🚀
