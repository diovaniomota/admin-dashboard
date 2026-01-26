const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log('--- Checking app_users ---');
    const { data: users, error: usersErr } = await supabase.from('app_users').select('*').limit(1);
    if (usersErr) {
        console.error('Error fetching app_users:', usersErr);
    } else {
        console.log('app_users keys:', users.length > 0 ? Object.keys(users[0]) : 'No records');
    }

    console.log('\n--- Checking user_profiles ---');
    const { data: profiles, error: profilesErr } = await supabase.from('user_profiles').select('*').limit(1);
    if (profilesErr) {
        console.error('Error fetching user_profiles:', profilesErr);
    } else {
        console.log('user_profiles keys:', profiles.length > 0 ? Object.keys(profiles[0]) : 'No records');
    }
}

check();
