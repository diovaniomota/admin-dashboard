const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Inspecting Vehicles ---");
    const { data: vehicles, error: vError } = await supabase
        .from('vehicles')
        .select('*')
        .limit(5);

    if (vError) console.error('Error fetching vehicles:', vError);
    else {
        console.log(`Found ${vehicles.length} vehicles.`);
        if (vehicles.length > 0) {
            console.log('Sample Vehicle Keys:', Object.keys(vehicles[0]));
            // Check for organization linking columns
            const vKeys = Object.keys(vehicles[0]);
            console.log('Vehicle has organization_id?', vKeys.includes('organization_id'));
            console.log('Vehicle has empresa_id?', vKeys.includes('empresa_id'));

            console.log('\nSample Vehicle Data:');
            vehicles.forEach(v => {
                console.log(`ID: ${v.id} | Plate: ${v.plate} | OrgID: ${v.organization_id} | ClientID: ${v.client_id}`);
            });
        }
    }

    console.log("\n--- Inspecting Purchases (invoices) ---");
    // Assuming table name is 'invoices' or 'purchases' or 'notas_fiscais' - let's try 'invoices' first based on context, or list tables if unsure. 
    // Actually, looking at previous file list, there was 'compras' dir. Let's guess 'transactions' or 'invoices'.
    // Let's try 'transactions' as it's common, or check valid table names. 
    // Since I can't easily list tables via API without a robust query, I'll try a common guess.
    // The user screenshot says "Entradas de Notas".

    const { data: transactions, error: tError } = await supabase
        .from('transactions') // Guessing
        .select('*')
        .limit(5);

    if (tError) {
        console.log('Could not fetch "transactions", trying "invoices"...');
        const { data: invoices, error: iError } = await supabase.from('invoices').select('*').limit(5);
        if (iError) console.error('Error fetching invoices:', iError);
        else {
            console.log(`Found ${invoices.length} invoices.`);
            if (invoices.length > 0) {
                console.log('Sample Invoice Keys:', Object.keys(invoices[0]));
                invoices.forEach(i => console.log(`ID: ${i.id} | OrgID: ${i.organization_id}`));
            }
        }
    } else {
        console.log(`Found ${transactions.length} transactions.`);
        if (transactions.length > 0) {
            console.log('Sample Transaction Keys:', Object.keys(transactions[0]));
            transactions.forEach(t => console.log(`ID: ${t.id} | OrgID: ${t.organization_id} | Type: ${t.type}`));
        }
    }
}

inspect();
