-- Migration Script: Update count_records table
-- สำหรับผู้ที่สร้าง table ไปแล้วด้วย column ชื่อ "countedAt"

-- Option 1: ลบ table เก่าและสร้างใหม่ (เหมาะถ้ายังไม่มีข้อมูลสำคัญ)
DROP TABLE IF EXISTS public.count_records CASCADE;

-- สร้าง table ใหม่ด้วย column ที่ถูกต้อง
CREATE TABLE IF NOT EXISTS public.count_records (
    id BIGSERIAL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "productName" TEXT,
    "employeeId" TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_count_records_serial ON public.count_records ("serialNumber");
CREATE INDEX IF NOT EXISTS idx_count_records_timestamp ON public.count_records ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_count_records_employee ON public.count_records ("employeeId");

-- Enable RLS
ALTER TABLE public.count_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow anonymous read access on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous read access on count_records"
    ON public.count_records FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous insert on count_records"
    ON public.count_records FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous update on count_records"
    ON public.count_records FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous delete on count_records"
    ON public.count_records FOR DELETE TO anon USING (true);

-- ===============================================================
-- Option 2: เปลี่ยนชื่อ column (เหมาะถ้ามีข้อมูลแล้วและต้องการเก็บไว้)
-- ===============================================================
-- ถ้าคุณสร้าง table ไปแล้วและมีข้อมูลแล้ว ใช้คำสั่งนี้แทน:
-- 
-- ALTER TABLE public.count_records 
-- RENAME COLUMN "countedAt" TO "timestamp";
-- 
-- -- อัพเดท index name
-- DROP INDEX IF EXISTS idx_count_records_counted;
-- CREATE INDEX IF NOT EXISTS idx_count_records_timestamp 
-- ON public.count_records ("timestamp" DESC);
