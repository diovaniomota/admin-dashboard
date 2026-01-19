## Diagnóstico
- Confirmar que o erro ocorre ao inserir `ordens_servico` quando `client_id` pertence a outro `organization_id` (tenant) do usuário.
- Mapear os pontos que hoje permitem “vazamento” de dados cross-tenant na UI (lista de clientes, busca de veículo, busca de produtos).

## Correção no Servidor (criação da OS)
- Ajustar [SupabaseOSRepository.criar](file:///c:/Users/Usuario/Desktop/admin-dashboard/next-dashboard/features/ordens-servico/data/repositories/supabase-os.repository.ts#L22-L94) para:
  - Remover o “auto-claim” de cliente (não tentar mover `clients.organization_id`).
  - Buscar `clients.organization_id` com service role e, se for diferente de `data.empresaId`, retornar erro de domínio amigável (ex.: “Cliente pertence a outra empresa”).
  - Não ignorar erros de update/queries (sempre checar `error`).

## Correção na Tela (evitar seleção errada)
- Refatorar [nova/page.tsx](file:///c:/Users/Usuario/Desktop/admin-dashboard/next-dashboard/app/ordens-servico/nova/page.tsx#L9-L23) para buscar clientes já filtrados pelo tenant:
  - Trocar para Server Component (remover `use client`).
  - Resolver `empresaId` via [getEmpresaAtivaOrThrow](file:///c:/Users/Usuario/Desktop/admin-dashboard/next-dashboard/shared/lib/auth-server.ts#L33-L81) e fazer `select` em `clients` com filtro por `organization_id`.
  - Passar a lista filtrada como props para o `OSForm`.

## Proteção extra no Formulário
- Em [OSForm.tsx](file:///c:/Users/Usuario/Desktop/admin-dashboard/next-dashboard/features/ordens-servico/ui/components/OSForm.tsx#L101-L164), ao encontrar um veículo e tentar auto-preencher `clienteId`:
  - Só auto-preencher se o cliente do veículo existir na lista `clientes` carregada para o tenant.
  - Caso contrário, mostrar erro “Veículo/cliente pertence a outra empresa” e não setar `clienteId`.

## Verificação
- Reproduzir no ambiente local: tentar criar OS com cliente de outro tenant deve resultar em mensagem amigável.
- Criar OS com cliente do tenant correto deve funcionar.
- Validar que o dropdown de clientes não mostra registros de outros tenants.