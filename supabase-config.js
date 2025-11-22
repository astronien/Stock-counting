// Supabase Configuration
// ใส่ค่าจาก Supabase Project Settings -> API
export const SUPABASE_URL = "https://hkgsikylshyopoekgqbe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3Npa3lsc2h5b3BvZWtncWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzY1OTEsImV4cCI6MjA3OTQxMjU5MX0.2mrhZ1WR_T3B4RZgiyTR5MsGU2bQtLFj3wod04yNLEs";

// Initialize Supabase Client
// Note: We assume the Supabase SDK is loaded via CDN in index.html
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export function getSupabase() {
    if (!window.supabase) {
        console.error('Supabase SDK not loaded!');
        return null;
    }
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const COLLECTIONS = {
    STOCK: 'stock',
    COUNT_RECORDS: 'count_records'
};
