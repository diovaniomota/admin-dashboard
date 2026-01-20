'use server';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials in environment variables.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export async function updateUserAccess(organizationId: string, email: string, password?: string) {
    try {
        // 1. Find the admin user linked to this organization in app_users
        const { data: appUser, error: findError } = await supabaseAdmin
            .from('app_users')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('role', 'admin') // Assuming we want to update the main admin
            .single();

        if (findError || !appUser) {
            console.error('User not found for org:', organizationId);
            return { success: false, error: 'Usuário administrador não encontrado para esta empresa.' };
        }

        const authUserId = appUser.auth_id;

        // 2. Update Auth User (Email and/or Password)
        const updateData: any = { email: email };
        if (password && password.length >= 6) {
            updateData.password = password;
        }

        const { data: authUpdate, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            updateData
        );

        if (authError) {
            console.error('Error updating auth:', authError);
            return { success: false, error: 'Erro ao atualizar autenticação: ' + authError.message };
        }

        // 3. Update app_users email
        const { error: appUserUpdateError } = await supabaseAdmin
            .from('app_users')
            .update({ email: email })
            .eq('id', appUser.id);

        if (appUserUpdateError) {
            console.error('Error updating app_users:', appUserUpdateError);
            // Non-fatal, but good to report
        }

        // 4. Update organization email (handled by client-side usually, but good to sync)
        const { error: orgUpdateError } = await supabaseAdmin
            .from('organizations')
            .update({ email: email })
            .eq('id', organizationId);

        return { success: true };

    } catch (error: any) {
        console.error('Server Action Error:', error);
        return { success: false, error: error.message };
    }
}
