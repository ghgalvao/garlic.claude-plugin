---
name: notion
description: >
  Monta o HQ do produto no Notion (Infra/Repos/Hospedagem/Banco/Wiki/
  Moodboard/Roadmap/Kanban) a partir do template garlic.docs/notion/, ou
  popula link real de repo/hospedagem/banco num HQ que já existe. Use
  quando o usuário digitar /garlic:notion, pedir "montar o HQ no Notion",
  ou colar uma URL de repo/Supabase/deploy real pra atualizar o HQ.
---

Duas funções — decidir qual pelo que `args`/o usuário pedir:
**(A) montar o HQ do zero** numa página Notion vazia, ou **(B) popular** um
HQ que já existe (trocar `<url-do-repo>`/`<placeholder>` por valor real).
Se ambíguo, perguntar antes de agir.

Fonte de verdade de todo conteúdo = `garlic.docs/notion/*.md` (Notion é
espelho, nunca a fonte — se o conteúdo mudar, é lá que edita, não aqui).
Se o repo `garlic.docs` do produto estiver clonado localmente, ler os `.md`
de lá antes de agir (podem ter mudado desde que este skill foi escrito).
Antes de tudo, ler `notion://docs/enhanced-markdown-spec` — sintaxe de
`<columns>`/`<page>`/`<mention-page>` muda o resultado.

## (A) Montar o HQ do zero

1. **Confirmar o destino com o humano — nunca assumir.** Usar `notion-fetch`
   (`id: "self"`) pra identificar o workspace conectado, confirmar qual
   página **vazia** vira o HQ. Nunca criar dentro de página com conteúdo de
   outro produto sem confirmação explícita.

2. **Criar as 8 áreas primeiro, o HQ raiz por último.** Ordem importa: mover
   uma página (`notion-move-pages`) depois de já referenciada numa coluna
   quebra a referência (vira bloco `<page>` órfão) — criar toda a hierarquia
   antes de montar as `<columns>`, nunca depois.
   - `🧄 Repos` (+ 5 filhas: `<produto>.frontend/.infra/.automations/.backend/.docs`,
     link `<url-do-repo>` placeholder), `☁️ Hospedagem`, `🗄️ Banco de dados`
     — filhas diretas do HQ (**não criar uma página "Infra" intermediária**
     — "Infra" é só rótulo de coluna). Conteúdo completo em
     `garlic.docs/notion/infra.md`.
   - `📚 Wiki` + filhas `⚙️ Setup & Ambiente` / `🚀 Runbook` —
     `garlic.docs/notion/{wiki,setup-ambiente,runbook-redeploy}.md`.
   - `🎨 Moodboard` — `garlic.docs/notion/moodboard.md` (vazio de propósito).
   - `🗺️ Roadmap` — `garlic.docs/notion/roadmap.md` (vazio de propósito).
   - `📋 Kanban Board` + 2 databases (`🛠️ Desenvolvimento`, `📈 Estratégico`) —
     schema em `garlic.docs/notion/kanban.md`, inclui `Duração` (rich_text) e
     `Tokens` (number) — propriedades gravadas por `garlic:task-end`, não
     comentário.

3. **Criar a página HQ** (`🎯 <Produto> — HQ`): intro (o que é o produto) +
   callout de registro + bloco `<columns>`, **5 colunas ratio 20**, 1 por
   área (Infra, Wiki, Moodboard, Roadmap, Kanban Board). Cada coluna =
   heading `###` com ícone + `---` + `<page url="...">` de cada filha
   direta daquela área (ex.: coluna Infra lista `<page>` de Repos +
   Hospedagem + Banco de dados; coluna Wiki lista `<page>` de Wiki +
   `<mention-page>` de Setup & Ambiente/Runbook).

4. **Registrar o link** do HQ em `garlic.docs/README.md` (mapa do workspace)
   — vira a entrada "Backlog oficial / HQ Notion".

## (B) Popular link real num HQ que já existe

Quando um repo ganha remote de verdade (passo 3 de `garlic:new`), um
projeto Supabase é criado, ou um deploy sobe: achar a subpágina certa
(busca pelo nome — `<produto>.<parte>` em Repos, ou a linha certa em
Hospedagem/Banco de dados) e editar **só o valor**, nunca reescrever o
resto do conteúdo. Não achou a página/HQ? Perguntar a URL do HQ antes de
inventar uma busca.

## Ferramentas MCP esperadas
`notion-fetch`, `notion-create-pages`, `notion-create-database`,
`notion-update-page`, `notion-move-pages` (só antes de montar as colunas,
nunca depois). Sem MCP do Notion conectado: parar e pedir pro humano
conectar antes de continuar.
