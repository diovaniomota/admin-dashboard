const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'sb_secret_wt3vKrLmGUJUjQ-QL7-m7w_npRWo2yA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- Inspecting Purchases Data ---");
    const { data: purchases, error } = await supabase
        .from('purchases')
        .select('id, empresa_id, fornecedor_nome')
        .limit(3);

    if (error) console.error(error);
    else console.log(JSON.stringify(purchases, null, 2));
}

inspect();
