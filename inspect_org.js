
const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys from admin-dashboard/app/lib/supabaseClient.ts
const supabaseUrl = 'https://xpypctupocfwwyoqhioi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweXBjdHVwb2Nmd3d5b3FoaW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODI5MTIsImV4cCI6MjA4MzY1ODkxMn0.jssMOGLnB_ftUdYRSFXGf4q3wE4TzFzqtOHR7deEBAo';

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Fetching organizations...");
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Records found:', data.length);
        if (data.length > 0) {
            console.log('All Keys:', JSON.stringify(Object.keys(data[0]), null, 2));

            data.forEach(org => {
                console.log(`ID: ${org.id} | Codigo: ${org.codigo} | Name: ${org.nome_fantasia} | Email: ${JSON.stringify(org.email, null, 2)}`);
            });
        }
    }
}

inspect();
