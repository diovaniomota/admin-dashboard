import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
// Use SERVICE ROLE KEY
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting sales columns and constraints ---');

    // Minimal payload to provoke constraints
    const payload = {
        organization_id: 1,
        empresa_id: 1,
        created_at: new Date().toISOString(),
        total: 100.00,
        status: 'completed'
    };

    console.log("Attempting test insert with minimal payload:", payload);

    const { data, error } = await supabase
        .from('sales')
        .insert([payload])
        .select();

    if (error) {
        fs.writeFileSync('error_log.json', JSON.stringify({
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        }, null, 2));
        console.log("Error written to error_log.json");
    } else {
        console.log('Insert SUCCESS (Constraints passed)!', data);
        if (data && data[0] && data[0].id) {
            await supabase.from('sales').delete().eq('id', data[0].id);
        }
    }
}

inspect();
