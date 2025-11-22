// Supabase Configuration
// ใส่ค่าจาก Supabase Project Settings -> API
export const SUPABASE_URL = "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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
