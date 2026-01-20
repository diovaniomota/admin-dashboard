import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweXBjdHVwb2Nmd3d5b3FoaW9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA4MjkxMiwiZXhwIjoyMDgzNjU4OTEyfQ.sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting clients ---');

    const { data: latestRows, error: RowError } = await supabase
        .from('clients')
        .select('id, name, created_at, organization_id, empresa_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (RowError) {
        console.error('Error fetching rows:', RowError);
    } else if (latestRows && latestRows.length > 0) {
        console.log('Latest 5 Clients:');
        latestRows.forEach(row => {
            console.log(JSON.stringify(row, null, 2));
        });
    } else {
        console.log('Table appears empty.');
    }
}

inspect();
