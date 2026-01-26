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

export async function createClientAction(formData: any, enabledFeatures: string[]) {
    try {
        // 1. Create User in Auth (Administrative)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.admin_email,
            password: formData.admin_password,
            email_confirm: true,
            user_metadata: {
                name: formData.admin_name,
                role: 'Administrador',
                is_super_admin: false
            }
        });

        if (authError) {
            console.error('Auth Creation Error:', authError);
            return { success: false, error: 'Erro ao criar autenticação: ' + authError.message };
        }

        const authId = authData.user.id;

        // 2. Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([{
                razao_social: formData.razao_social,
                nome_fantasia: formData.nome_fantasia,
                cnpj: formData.cnpj,
                email: formData.email,
                phone: formData.phone,
                plan: formData.plan,
                status: 'ativo',
                admin_user_id: authId,
                enabled_features: enabledFeatures,
                inscricao_estadual: formData.inscricao_estadual,
                cnae_principal: formData.cnae_principal,
                cep: formData.cep,
                logradouro: formData.logradouro,
                numero: formData.numero,
                bairro: formData.bairro,
                cidade: formData.cidade,
                uf: formData.uf,
                cod_ibge: formData.cod_ibge
            }])
            .select()
            .single();

        if (orgError) {
            console.error('Org Creation Error:', orgError);
            // Rollback auth user? (Optional, but could be good)
            await supabaseAdmin.auth.admin.deleteUser(authId);
            return { success: false, error: 'Erro ao criar organização: ' + orgError.message };
        }

        // 3. Create User Profile (Legacy)
        await supabaseAdmin
            .from('user_profiles')
            .insert([{
                id: authId,
                name: formData.admin_name,
                role: 'Administrador',
                organization_id: orgData.id,
                is_super_admin: false
            }]);

        // 4. Create App User (NextDashboard)
        const { error: appUserError } = await supabaseAdmin
            .from('app_users')
            .insert([{
                auth_id: authId,
                name: formData.admin_name,
                role: 'admin',
                organization_id: orgData.id,
                email: formData.admin_email
            }]);

        if (appUserError) {
            console.error('AppUser Creation Error:', appUserError);
        }

        return { success: true, organizationId: orgData.id, authId: authId };

    } catch (error: any) {
        console.error('createClientAction fatal error:', error);
        return { success: false, error: error.message || 'Erro interno no servidor.' };
    }
}

