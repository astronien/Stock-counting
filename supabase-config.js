// Supabase Configuration
// ใส่ค่าจาก Supabase Project Settings -> API
export const SUPABASE_URL = "https://hkgsikylshyopoekgqbe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3Npa3lsc2h5b3BvZWtncWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzY1OTEsImV4cCI6MjA3OTQxMjU5MX0.2mrhZ1WR_T3B4RZgiyTR5MsGU2bQtLFj3wod04yNLEs";

// Initialize Supabase Client
// Note: We assume the Supabase SDK is loaded via CDN in index.html
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export function getSupabase() {
    // The CDN version exposes createClient directly on window.supabase
    const { createClient } = window.supabase || {};

    if (!createClient) {
        console.error('Supabase SDK not loaded! Make sure the CDN script is loaded.');
        return null;
    }

    console.log('Initializing Supabase with URL:', SUPABASE_URL);

    // Check for empty or invalid URL
    if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
        console.error('Invalid Supabase URL:', SUPABASE_URL);
        alert('Supabase URL ไม่ถูกต้อง กรุณาตรวจสอบ supabase-config.js');
        return null;
    }

    return createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());
}

export const COLLECTIONS = {
    STOCK: 'stock',
    COUNT_RECORDS: 'count_records'
};
