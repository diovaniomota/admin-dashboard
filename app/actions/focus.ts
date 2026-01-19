'use server';

const FOCUS_NFE_URL = process.env.FOCUS_NFE_AMBIENTE === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

const getToken = () => {
    const token = process.env.FOCUS_NFE_TOKEN;
    if (!token) throw new Error('FOCUS_NFE_TOKEN não configurado.');
    return token;
};

export async function createCompanyInFocus(data: any) {
    // Token de Produção (Revenda) fornecido especificamente para cadastro de empresas
    // Usado para permitir testes em homologação sem mudar o token global de emissão
    const RESELLER_TOKEN = '90MRioho0tAMZRuEuUAkpKXOieFDGldO';

    // Se estiver em homologação, usa o token de revenda explícito. Se em produção, usa o do ambiente.
    const tokenToUse = process.env.FOCUS_NFE_AMBIENTE === 'producao' ? getToken() : RESELLER_TOKEN;
    const authHeader = 'Basic ' + Buffer.from(tokenToUse + ':').toString('base64');

    // Mapear dados do formulário para o formato da API Focus NFe
    const payload = {
        nome: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: data.cnpj.replace(/\D/g, ''),
        inscricao_estadual: data.inscricao_estadual?.replace(/\D/g, ''),
        inscricao_municipal: data.inscricao_municipal?.replace(/\D/g, ''),
        regime_tributario: data.regime_tributario || '1', // 1=Simples Nacional (padrão)
        email: data.email,
        telefone: data.phone?.replace(/\D/g, ''),
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.cidade,
        uf: data.uf,
        cep: data.cep?.replace(/\D/g, ''),
        discriminacao_servicos: 'Serviços Prestados',
        referencia: data.cnpj.replace(/\D/g, '') // CRÍTICO: Define o CNPJ como ID externo para facilitar buscas
    };

    // A API de cadastro de empresas da Focus NFe (Revenda) funciona apenas em Produção
    // e requer um token de produção com permissão de revenda.
    // Tokens de homologação não têm permissão para criar empresas via API.
    const isProducao = process.env.FOCUS_NFE_AMBIENTE === 'producao';

    // A API de cadastro de empresas da Focus NFe (Revenda) funciona APENAS na URL de Produção.
    // Mesmo em ambiente de homologação, devemos chamar a URL de produção para criar a empresa.
    // O Token usado deve ter permissão para isso (Token de Produção/Revenda).
    // Se o usuário estiver usando um token de teste simples, a API retornará 403/401.
    // Vamos TENTAR fazer a chamada mesmo assim para atender a solicitação de integração total.
    if (!isProducao) {
        console.log('[Focus NFe] Ambiente de Homologação. Tentando criar empresa na URL de Produção (requer Token de Revenda)...');
    }

    try {
        const COMPANIES_API_URL = 'https://api.focusnfe.com.br';
        console.log(`[Focus NFe] Criando empresa em Produção: ${payload.nome} (${payload.cnpj})`);

        const response = await fetch(`${COMPANIES_API_URL}/v2/empresas`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return {
                    success: false,
                    error: 'Permissão Negada: Para criar empresas via API, é necessário um Token de Produção/Revenda. O token atual não tem permissão.'
                };
            }

            const errorText = await response.text();
            console.error('[Focus NFe] Erro ao criar empresa:', errorText);

            try {
                const errorJson = JSON.parse(errorText);
                return { success: false, error: errorJson.mensagem || errorJson.message || JSON.stringify(errorJson) };
            } catch {
                return { success: false, error: errorText };
            }
        }

        const result = await response.json();
        return { success: true, data: result };

    } catch (error: any) {
        console.error('[Focus NFe] Erro na requisição:', error);
        return { success: false, error: error.message };
    }
}

export async function syncCompanyToFocus(data: any) {
    // 1. Tenta Atualizar (PUT)
    // Se der 404 (Não encontrado), tenta Criar (POST)

    // Configurações de Token e URL
    const RESELLER_TOKEN = '90MRioho0tAMZRuEuUAkpKXOieFDGldO';
    const tokenToUse = process.env.FOCUS_NFE_AMBIENTE === 'producao' ? getToken() : RESELLER_TOKEN;
    const authHeader = 'Basic ' + Buffer.from(tokenToUse + ':').toString('base64');

    // Sempre usa URL de produção para cadastro/update de empresas
    const COMPANIES_API_URL = 'https://api.focusnfe.com.br';
    const cnpjOnlyNumbers = data.cnpj.replace(/\D/g, '');

    const payload = {
        nome: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: cnpjOnlyNumbers,
        inscricao_estadual: data.inscricao_estadual?.replace(/\D/g, ''),
        inscricao_municipal: data.inscricao_municipal?.replace(/\D/g, ''),
        regime_tributario: data.regime_tributario || '1',
        email: data.email,
        telefone: data.phone?.replace(/\D/g, ''),
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.cidade,
        uf: data.uf,
        cep: data.cep?.replace(/\D/g, ''),
        discriminacao_servicos: 'Serviços Prestados'
    };

    try {
        console.log(`[Focus NFe] Tentando ATUALIZAR empresa: ${cnpjOnlyNumbers}`);
        console.log(`[Focus NFe] URL: ${COMPANIES_API_URL}/v2/empresas/${cnpjOnlyNumbers}`);

        const responsePut = await fetch(`${COMPANIES_API_URL}/v2/empresas/${cnpjOnlyNumbers}`, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (responsePut.ok) {
            const result = await responsePut.json();
            return { success: true, action: 'updated', data: result };
        } else if (responsePut.status === 404) {
            console.log(`[Focus NFe] Empresa não encontrada (404) no PUT. Tentando CRIAR (POST)...`);
            // Chama a função de criação existente
            return await createCompanyInFocus(data);
        } else {
            // Erro real no PUT
            const errorText = await responsePut.text();
            console.error(`[Focus NFe] Erro PUT: ${responsePut.status} - ${errorText}`);

            try {
                const errorJson = JSON.parse(errorText);
                const msg = errorJson.mensagem || errorJson.message || '';

                if (msg.includes('Endpoint nao encontrado') || msg.includes('nao_encontrado')) {
                    return {
                        success: false,
                        error: `Erro de Permissão (API): O endpoint de gestão de empresas não está acessível. Verifique se o Token Principal (${tokenToUse.substring(0, 4)}...) pertence a uma conta de Parceiro/Revenda habilitada.`
                    };
                }

                return { success: false, error: msg || JSON.stringify(errorJson) };
            } catch {
                return { success: false, error: errorText };
            }
        }

    } catch (err: any) {
        console.error('[Focus NFe] Erro no Sync:', err);
        return { success: false, error: err.message };
    }
}
