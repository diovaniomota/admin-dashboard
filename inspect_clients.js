const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Fetching clients...");
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${clients.length} clients.`);
        if (clients.length > 0) {
            console.log('Sample Client:', JSON.stringify(clients[0], null, 2));
            // Check if organization_id exists in keys
            const keys = Object.keys(clients[0]);
            console.log('Has organization_id?', keys.includes('organization_id'));
            console.log('Has empresa_id?', keys.includes('empresa_id'));
            console.log('Has user_id?', keys.includes('user_id'));
        }
    }
}

inspect();
