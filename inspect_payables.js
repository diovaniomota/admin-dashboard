const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Inspecting finance_payables ---");
    const { data, error } = await supabase
        .from('finance_payables')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching finance_payables:', error);
    } else {
        if (data.length > 0) {
            console.log('Keys:', Object.keys(data[0]));
        } else {
            console.log('Table exists but is empty. Cannot infer keys from data.');
            // Try to insert a dummy to see error or just fail
        }
    }
}

inspect();
