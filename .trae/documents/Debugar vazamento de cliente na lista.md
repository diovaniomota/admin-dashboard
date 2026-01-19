## Debug e Correção de Cache
- Adicionar logs no `app/ordens-servico/nova/page.tsx` para mostrar no console do servidor:
  - O `empresaId` recuperado.
  - A quantidade de clientes encontrados.
  - Os nomes dos clientes retornados (para confirmar se o "HOUSE BEER" está vindo do banco ou se é cache local).
- Adicionar `export const dynamic = 'force-dynamic'` na página para impedir cache estático do Next.js.

## Verificar RLS de Clientes
- Conferir se a tabela `clients` tem a coluna `organization_id` corretamente populada para esse cliente específico. Pode ser que ele esteja com o ID errado ou nulo, e alguma política RLS esteja vazando.
- (Ação via SQL, se necessário, mas primeiro vamos diagnosticar via código).

## Verificar Dropdown
- Confirmar no `OSForm.tsx` se a lista `clientes` está sendo usada diretamente ou se tem algum `useEffect` que sobrescreve com um fetch local (o código mostra que ele recebe via props, mas vale checar se não tem cache de cliente sobrando).

## Plano de Execução
1. Modificar `page.tsx` com logs e `force-dynamic`.
2. Pedir para você recarregar a página e verificar os logs do terminal.
3. Se o log mostrar o cliente lá, então o problema é no banco (RLS ou dado incorreto). Se o log NÃO mostrar, então é cache do navegador/Service Worker.