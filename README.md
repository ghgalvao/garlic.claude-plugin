# garlic.claude-plugin

Plugin do Claude Code pro workspace multi-repo **Garlic** (SaaS-starter).
Resolve: detecção automática de workspace, bootstrap de
produto novo, rebrand, montagem do HQ no Notion, CI/CD de deploy, e
medição de tempo/token por task.

## `SessionStart` — detecção automática

Toda sessão nova, dentro de qualquer repo clonado no padrão Garlic
(`<produto>.frontend`, `.infra`, `.automations`, `.backend`, `.docs`,
irmãos), recebe automaticamente no contexto:
- Que está num workspace Garlic e qual o nome do produto.
- Onde fica o cérebro **global** (`<produto>.docs`).
- Onde fica o cérebro **local** deste repo (`project/` ou `docs/`, se
  existir).

Sem isso, uma sessão aberta direto num repo isolado (ex.: só
`foodpdv.frontend`) não tem nenhum sinal de que existe um workspace
multi-root ao redor — precisa inferir por heurística (frágil, já causou
confusão real num teste com o clone `foodpdv`, ver
`garlic.docs/task-master.md` 2026-08-25).

Fica em silêncio (zero output) fora de um workspace Garlic — não polui
sessão em repo qualquer.

## `/garlic:new` — bootstrap de produto novo

Automatiza `bootstrap-new-product.md` (clona os 5 repos renomeando, corta
histórico git, cria branch `develop`, corrige o `.code-workspace`) via tool
calls de verdade, não checklist manual. Funciona numa máquina 100% limpa —
o skill já embute os passos, não depende de ter clonado `garlic.docs` antes
só pra ler a receita.

```
/garlic:new foodpdv
```

Mecanismo real = `skills/new/SKILL.md` (Skill do Claude Code, listada como
`garlic:new`) — **não** `commands/new.toml`. O `.toml` existe só por
compatibilidade cruzada com outra ferramenta (Gemini CLI lê comando nesse
formato); Claude Code em si nunca leu isso como slash command. Mesmo padrão
do plugin `caveman`: ele também mantém `commands/*.toml` só de brinde, quem
funciona de verdade lá é `skills/*/SKILL.md`.

## `/garlic:rebrand` — aplicar cor/fonte/nome no produto já bootstrapado

Companheira do `/garlic:new`: pega os valores exatos (nome, 5 cores, 2
fontes — normalmente colados do gerador em `garlic.landing`/Começar) e
aplica no `<produto>.frontend` já clonado — reusa a lógica de geração de cor
já existente no repo (`generateGlobalsCss.ts`), nunca reimplementa.

```
/garlic:rebrand foodpdv
```

Ver `skills/rebrand/SKILL.md`.

## `/garlic:notion` — montar o HQ no Notion (ou popular link real)

Automatiza `bootstrap-notion.md` (`garlic.docs`) — cria a estrutura
completa do HQ (Infra/Repos/Hospedagem/Banco/Wiki/Moodboard/Roadmap/Kanban,
layout em colunas) numa página vazia, ou popula `<url-do-repo>`/placeholder
com valor real num HQ que já existe. Fonte do conteúdo continua sendo
`garlic.docs/notion/*.md` — este skill só executa, nunca inventa conteúdo
novo que não esteja lá.

```
/garlic:notion foodpdv
```

Ver `skills/notion/SKILL.md`. Precisa do MCP do Notion conectado.

## `/garlic:ci` — criar, ajustar ou diagnosticar o CI/CD de um produto

Configura o deploy automático (GitLab → FTP em hospedagem Windows/IIS, ex.:
hostazul) de um front estático (Vite/Astro) e/ou de uma API .NET: copia e
adapta os templates, lista as variáveis do GitLab com as flags certas
(Protect OFF, Expand variable reference OFF, Mask nas senhas), gera o
`appsettings` no deploy sem segredo no repo e **verifica no ar** (janela de
503 do `app_offline.htm` + impressões digitais da versão nova) em vez de
confiar só no job verde.

Nasceu de uma sessão real (site + API de um projeto de cliente, 07/10/2026) em que erros
repetíveis custaram horas: `550` por `FTP_PATH` errado, senha corrompida por
"Expand variable reference", `appsettings.Production.json` antigo no
servidor sobrescrevendo a config nova (IIS roda em Production), caixa de
e-mail criada com nome errado. O skill documenta cada armadilha.

```
/garlic:ci meuproduto
```

Ver `skills/ci/SKILL.md` e `skills/ci/templates/` (`static-site.gitlab-ci.yml`,
`dotnet-api.gitlab-ci.yml`, `appsettings.Development.example.json`,
`web.config`, `wait-deploy.sh`).

> Nota: o `garlic.backend/.gitlab-ci.yml` ainda publica `self-contained
> win-x86`; o Green Hunter já provou que `framework-dependent` (Any CPU)
> sobe nessa hospedagem. Vale alinhar o template do backend com o skill.

## `/garlic:task-start` + `/garlic:task-end` — medir tempo/token de uma task

Marca início e fim de uma task — duração e tokens (output + cache-read)
sempre calculados por script lendo o transcript real da sessão
(`~/.claude/projects/**/*.jsonl`), nunca estimado no texto da resposta.
`task-end` também documenta o resultado: anexa no `task-master.md`
relevante e, se houver board Notion correspondente (schema em
`garlic.docs/notion/kanban.md`, propriedades `Duração`/`Tokens`), grava lá
também — best-effort, nunca falha o comando por causa do Notion.

```
/garlic:task-start "nome da task"
/garlic:task-end
```

Ver `skills/task-start/SKILL.md` e `skills/task-end/SKILL.md`.

## Princípio — path de escrita de arquivo, sempre resolvido programaticamente

Qualquer skill deste plugin que grava arquivo via script (Node/Bash) resolve
o caminho programaticamente — `fileURLToPath(import.meta.url)` +
`path.dirname()` a partir de onde o próprio script mora, ou argumento
explícito de repo-root — **nunca `../../..` contado na mão**. Contagem manual
de nível é o tipo de erro que só aparece na execução (writeFileSync relativo
usa `cwd` do processo, não a pasta do script — pegadinha clássica de Node),
não no review do texto do skill.

## Instalar

```
claude plugin marketplace add https://gitlab.com/planodeominacao/garlic.claude-plugin.git
claude plugin install garlic@garlic
```

Reiniciar a sessão do Claude Code depois de instalar — `/garlic:new` só aparece
na sessão seguinte.

## Estrutura

```
.claude-plugin/
  plugin.json        # manifesto — nome, hooks
  marketplace.json    # pra listar num marketplace, se um dia publicar
skills/
  new/SKILL.md          # /garlic:new — mecanismo real, é isso que o Claude Code lê
  rebrand/SKILL.md       # /garlic:rebrand — idem
  notion/SKILL.md        # /garlic:notion — idem
  ci/SKILL.md            # /garlic:ci — idem
  ci/templates/          # .gitlab-ci.yml (estático e .NET), appsettings exemplo, web.config, wait-deploy.sh
  task-start/SKILL.md    # /garlic:task-start — idem
  task-end/SKILL.md      # /garlic:task-end — idem
commands/
  new.toml             # /garlic:new — só compat cruzada (Gemini CLI etc), ignorado pelo Claude Code
  rebrand.toml          # /garlic:rebrand — idem, texto duplicado do SKILL.md, manter em sync
  notion.toml           # /garlic:notion — idem
  ci.toml               # /garlic:ci — idem
  task-start.toml        # /garlic:task-start — idem
  task-end.toml          # /garlic:task-end — idem
hooks/
  garlic-detect.js    # SessionStart
```
