import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
// Use ANON key from .env.local
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweXBjdHVwb2Nmd3d5b3FoaW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODI5MTIsImV4cCI6MjA4MzY1ODkxMn0.jssMOGLnB_ftUdYRSFXGf4q3wE4TzFzqtOHR7deEBAo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting sales schema ---');

    const { data: latestRows, error: RowError } = await supabase
        .from('sales')
        .select('*')
        .limit(1);

    if (RowError) {
        console.error('Error fetching row:', RowError);
    } else if (latestRows && latestRows.length > 0) {
        console.log('Sample Row Keys:', Object.keys(latestRows[0]));
        console.log('Sample Row:', JSON.stringify(latestRows[0], null, 2));
    } else {
        console.log('Table appears empty.');
        // Try to insert a dummy to see errors if empty
    }
}

inspect();
