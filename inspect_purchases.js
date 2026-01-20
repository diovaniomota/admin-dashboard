const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Inspecting Purchases ---");
    const { data: purchases, error: pError } = await supabase
        .from('purchases')
        .select('*')
        .limit(1);

    if (pError) console.error('Error fetching purchases:', pError);
    else {
        if (purchases.length > 0) {
            console.log('Purchase Keys:', Object.keys(purchases[0]));
        } else {
            console.log('Purchases table is empty.');
        }
    }

    console.log("\n--- Inspecting Suppliers ---");
    const { data: suppliers, error: sError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(1);

    if (sError) console.error('Error fetching suppliers:', sError);
    else {
        if (suppliers.length > 0) {
            console.log('Supplier Keys:', Object.keys(suppliers[0]));
        } else {
            console.log('Suppliers table is empty.');
        }
    }
}

inspect();
