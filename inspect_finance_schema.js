const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Inspecting finance_payables ---");
    const { data: payables, error: pError } = await supabase
        .from('finance_payables')
        .select('*')
        .limit(1);

    if (pError) console.error('Error fetching payables:', pError);
    else if (payables.length > 0) console.log('Payables Keys:', Object.keys(payables[0]));
    else console.log('Payables table empty, cannot infer keys.');

    console.log("\n--- Inspecting finance_receivables ---");
    const { data: receivables, error: rError } = await supabase
        .from('finance_receivables')
        .select('*')
        .limit(1);

    if (rError) console.error('Error fetching receivables:', rError);
    else if (receivables.length > 0) console.log('Receivables Keys:', Object.keys(receivables[0]));
    else console.log('Receivables table empty, cannot infer keys.');
}

inspect();
