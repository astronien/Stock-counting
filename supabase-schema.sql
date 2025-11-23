-- Supabase Schema for Stock Counting System
-- Run this in your Supabase SQL Editor

-- ====================================
-- 1. Stock Table (สินค้าทั้งหมด)
-- ====================================
CREATE TABLE IF NOT EXISTS public.stock (
    id BIGSERIAL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL UNIQUE,
    "productName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster serial number lookups
CREATE INDEX IF NOT EXISTS idx_stock_serial ON public.stock ("serialNumber");
CREATE INDEX IF NOT EXISTS idx_stock_updated ON public.stock ("updatedAt" DESC);

-- ====================================
-- 2. Count Records Table (ประวัติการนับ)
-- ====================================
CREATE TABLE IF NOT EXISTS public.count_records (
    id BIGSERIAL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "productName" TEXT,
    "employeeId" TEXT,
    "countedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_count_records_serial ON public.count_records ("serialNumber");
CREATE INDEX IF NOT EXISTS idx_count_records_counted ON public.count_records ("countedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_count_records_employee ON public.count_records ("employeeId");

-- ====================================
-- 3. Enable Row Level Security (RLS)
-- ====================================
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.count_records ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 4. RLS Policies - Allow anonymous access
-- ====================================

-- Stock table policies
DROP POLICY IF EXISTS "Allow anonymous read access on stock" ON public.stock;
CREATE POLICY "Allow anonymous read access on stock"
    ON public.stock
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on stock" ON public.stock;
CREATE POLICY "Allow anonymous insert on stock"
    ON public.stock
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on stock" ON public.stock;
CREATE POLICY "Allow anonymous update on stock"
    ON public.stock
    FOR UPDATE
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on stock" ON public.stock;
CREATE POLICY "Allow anonymous delete on stock"
    ON public.stock
    FOR DELETE
    TO anon
    USING (true);

-- Count records table policies
DROP POLICY IF EXISTS "Allow anonymous read access on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous read access on count_records"
    ON public.count_records
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous insert on count_records"
    ON public.count_records
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous update on count_records"
    ON public.count_records
    FOR UPDATE
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on count_records" ON public.count_records;
CREATE POLICY "Allow anonymous delete on count_records"
    ON public.count_records
    FOR DELETE
    TO anon
    USING (true);

-- ====================================
-- 5. Enable Realtime (Optional)
-- ====================================
-- Uncomment if you want real-time updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.stock;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.count_records;

-- ====================================
-- Done! 
-- ====================================
-- Tables created successfully ✓
-- You can now use your Stock Counting System!
