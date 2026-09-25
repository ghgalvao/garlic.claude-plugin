---
name: new
description: >
  Bootstrapar um produto novo a partir do template Garlic (clona os 5 repos,
  corta o histórico git, cria a branch develop, corrige o .code-workspace).
  Use quando o usuário digitar /garlic:new <produto>, ou pedir pra "iniciar
  um produto novo com o Garlic" / "bootstrapar em cima do template".
---

Bootstrapar um produto novo a partir do template Garlic. O nome do produto
vem em `args` (texto digitado depois de `/garlic:new`) — se vazio, perguntar
o nome (minúsculo, sem espaço) antes de continuar.

Repos-fonte: grupo GitLab `gitlab.com/planodeominacao`, privados —
`garlic.frontend`, `garlic.infra`, `garlic.automations`, `garlic.backend`,
`garlic.docs`.

**Convenção de nome local: hífen, sempre (`<produto>-frontend`, nunca
`<produto>.frontend`).** Lição de 2026-09-25 (Jocati SaaS): o template em si
usa ponto no GitLab (`planodeominacao/garlic.frontend`) porque é o nome
fixo do template, mas os grupos GitLab reais que os devs criam pra produtos
novos (ex. `aipintos/jocatisaas-frontend`) usam hífen — é o padrão de slug
mais comum e o que o dev realmente digitou na prática. Rodar este skill com
convenção de ponto e depois clonar de um remote com hífen (ou vice-versa)
deixa a pasta local com um nome e o `.code-workspace`/comentários de código
com outro — quebra a navegação multi-root e todo path cruzado entre repos
("ver jocatisaas.infra/..." aponta pra pasta que não existe). Por isso:
local sempre hífen, **e confirmar com o dev, antes do passo 1, se os 5
projetos remotos (quando forem criados no passo 3) vão usar o mesmo nome
com hífen** — não assumir, perguntar uma vez e seguir consistente.

Executar de verdade via Bash (não só descrever), na ordem:

1. **Clonar os 5 repos** no diretório atual, renomeando já no clone, e
   capturar o diretório base logo depois:
   ```
   mkdir -p <produto> && cd <produto>
   git clone https://gitlab.com/planodeominacao/garlic.frontend.git <produto>-frontend
   git clone https://gitlab.com/planodeominacao/garlic.infra.git <produto>-infra
   git clone https://gitlab.com/planodeominacao/garlic.automations.git <produto>-automations
   git clone https://gitlab.com/planodeominacao/garlic.backend.git <produto>-backend
   git clone https://gitlab.com/planodeominacao/garlic.docs.git <produto>-docs
   BASE="$(pwd)"
   ```
   **Cwd fica pendurado em `$BASE` entre chamadas de tool** (Bash persiste
   diretório entre execuções) — nunca assumir que voltou pra raiz sozinho.
   Todo passo seguinte abre com `cd "$BASE/<produto>-<parte>"` **absoluto**,
   nunca `cd <produto>-<parte>` relativo.

2. **Cortar a história** de cada uma das 5 pastas, a partir de `$BASE`:
   ```
   cd "$BASE/<produto>-frontend" && rm -rf .git && git init -q && git add -A \
     && git commit -q -m "Initial commit: <produto>-frontend (a partir do template Garlic)" \
     && git log --oneline
   ```
   Repetir pras outras 4 (`-infra`, `-automations`, `-backend`, `-docs`),
   sempre abrindo com `cd "$BASE/<produto>-<parte>"` absoluto primeiro.
   Perguntar nome/e-mail git do dev **antes**, configurar `--local` em cada
   repo — nunca mexer na config global do git.

   **Verificar cada uma:** `git log --oneline` do comando acima deve mostrar
   **exatamente 1 commit**. Mais que isso = cwd errado (rodou dentro do repo
   errado, ou repetiu um já cortado) — causa mais provável, conferir `pwd`
   antes de tentar de novo.

3. **Perguntar** se o dev já quer criar os remotes novos (GitLab/GitHub) e
   dar push (branch `master` + branch `develop` a partir dela). Só fazer se
   confirmado — não assumir, não criar remote sem o dev ter os 5 projetos
   vazios prontos do outro lado. **Confirmar que o slug dos 5 projetos
   remotos usa hífen** (`<produto>-frontend`, etc) — se o dev já criou com
   outro separador, usar o mesmo separador em TUDO daqui pra frente (passo
   4 incluso), não misturar.

4. **Corrigir o `.code-workspace`**: dentro de `<produto>-docs`, renomear
   `garlic.code-workspace` → `<produto>.code-workspace`, trocar os 4 paths
   (`../garlic.<parte>` → `../<produto>-<parte>`) e o `typescript.tsdk`.
   Confirmar abrindo o arquivo (conteúdo, não a UI) depois — os paths têm
   que bater exatamente com o nome real das 5 pastas locais (`ls ..` pra
   conferir, não assumir).

5. **Renomear todo vestígio interno de "garlic"** — isto é identidade
   técnica (nome), não marca (cor/fonte). Não espera o dev decidir cor/fonte
   pra acontecer; roda sempre, aqui, porque o nome do produto já é conhecido
   desde o passo 1. **Lição de 2026-09-24/25 (Jocati SaaS):** essa etapa
   morava no `/garlic:rebrand` antigo e ficava sem rodar até o dev pedir
   rebrand — produto ficava com pasta/CSS/backend ainda chamados "garlic" por
   dias, e o grep de verificação era case-sensitive (`grep -rn "Garlic"`),
   nunca pegava a esmagadora maioria das ocorrências reais (minúsculas,
   kebab-case). Agora: sempre roda aqui, grep sempre `-i`, escopo nos 5 repos.

   5.1. **Pasta e arquivos que carregam "garlic" no nome** — antes de
   qualquer grep de conteúdo, porque nome de pasta/arquivo já é vestígio:
   ```
   # em <produto>-frontend
   git mv apps/garlic apps/<produto>
   git mv apps/<produto>/src/app/styles/garlic-theme.css apps/<produto>/src/app/styles/theme.css
   ```
   Atualizar o `@import` em `apps/<produto>/src/index.css` pro novo nome do
   arquivo, e qualquer path hardcoded pra `apps/garlic` nos `.md` do repo
   (`CLAUDE.md`, `README.md`, `project/*.md`).
   ```
   # em <produto>-backend
   git mv Garlic.Backend.csproj <Produto>.Backend.csproj
   git mv Garlic.Backend.sln <Produto>.Backend.sln
   git mv Garlic.Backend.http <Produto>.Backend.http
   ```
   (`<Produto>` em PascalCase pro `.sln`/`.csproj` — convenção .NET.) Trocar
   a string `Garlic.Backend` pra `<Produto>.Backend` dentro do `.sln` e do
   `.http`.

   5.2. **Toda string "garlic" nos 5 repos — sempre `-i`:**
   ```
   grep -rni "garlic" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=bin --exclude-dir=obj .
   ```
   rodado em cada um dos 5 repos. Cobre pelo menos, além da prosa em `.md`:
   - **Prefixo de variável CSS** — `apps/<produto>/src/index.css` (`@theme`,
     ambos os temas) e `apps/<produto>/src/app/styles/theme.css`:
     `--color-garlic-*` → `--color-<produto>-*`. O Tailwind v4 deriva a
     classe utilitária do nome da variável, então essa troca sozinha não
     move as classes já escritas nos componentes (`bg-garlic-*`,
     `text-garlic-*`, `border-garlic-*`) — precisa de um segundo replace
     dessas classes em todo `.tsx`/`.ts` de `apps/<produto>/src`.
   - **Nome de animação** — `--animate-garlic-spin` / `@keyframes garlic-spin`
     em `index.css`, e a classe `animate-garlic-spin` onde for usada.
   - **Chaves de localStorage** — `ThemeContext.tsx` (`'garlic-theme'`) e
     `mockOverrides.ts` (`'garlic:mock-overrides'`).
   - **Rotas/plugins do Vite dev server** — `vite.config.ts`:
     `'garlic-env-writer'`/`'garlic-globals-css-writer'` (nome do plugin) e
     `/__garlic/write-env`/`/__garlic/write-globals-css'` (rota); atualizar
     os dois lados (definição no `vite.config.ts` e o `fetch()` que chama a
     rota em `EnvGeneratorCard.tsx`/`BrandingPanel.tsx`).
   - **`package.json`** — campo `"name"` nos 3 níveis que existirem, e
     qualquer `pnpm --filter garlic <script>` no root (`pnpm --filter
     <produto> <script>`).
   - **`translations/*.json`** — chaves `header.brand`/`shared.brand` e
     qualquer texto literal "Garlic"/"garlic.docs"/"garlic.frontend"/etc no
     dicionário da GuidePage (vira `<produto>-docs`/`<produto>-frontend`/etc,
     com hífen, pra bater com o nome real dos repos no GitLab).
   - **`apps/<produto>/index.html`** — `<title>Garlic</title>` →
     `<title><produto></title>`.
   - **Fixture de dev** — `app/config/supabase/fixtures.ts` e
     `mockClient.ts` têm `dev@garlic.local` → `dev@<produto>.local` (aparece
     logado no canto da tela em qualquer demo/screenshot).
   - **Comentários de código que citam produto anterior por nome** — se o
     histórico do template tiver uma limpeza de contaminação registrada
     (`lessons.md`/`task-master.md`/`CHANGELOG.md` do template-fonte),
     qualquer comentário vivo que ainda cite o nome do produto antigo por
     extenso também sai — trocar por "produto anterior" ou remover.

   5.3. **Verificar — obrigatório antes de seguir pro passo 6:**
   ```
   grep -rni "garlic" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=bin --exclude-dir=obj .
   ```
   rodado em cada um dos 5 repos **tem que voltar vazio** (fora
   `package-lock.json`/`pnpm-lock.yaml`, que resolvem sozinhos no próximo
   install) — critério de sucesso é o grep zerado, não "rodei os passos".
   Depois:
   ```
   pnpm install && pnpm build   # em <produto>-frontend
   dotnet build                 # em <produto>-backend
   ```
   Não reportar este passo como concluído sem grep vazio e os dois builds
   verdes.

6. **Instruir o dev, de forma explícita no report final, a abrir o
   workspace no editor** — `File → Open Workspace from File…` →
   `<produto>-docs/<produto>.code-workspace`. Nunca abrir só uma das 5
   pastas soltas (perde a navegação multi-root entre frontend/infra/
   automations/backend/docs).

7. **Parar aqui** — não escolher cor/fonte automaticamente, isso é decisão
   de marca separada do dev (o nome já foi resolvido no passo 5, não
   depende disso). Quando ele quiser aplicar cor/fonte: skill
   `garlic:rebrand` (mesmo plugin).

Se algum dos 5 repos clonados tiver `.agent/workflows/bootstrap-new-product.md`
(normalmente em `<produto>-docs`), usar como referência/conferência do
processo acima — não repetir do zero se já bater com o que está descrito aqui.

Ao final, reportar exatamente o que foi feito (passos 1-6), **destacar o
comando pra abrir o workspace** (`File → Open Workspace from File…` →
`<produto>-docs/<produto>.code-workspace`), e o que ficou pendente (cor/fonte
via `/garlic:rebrand`, Notion via `bootstrap-notion.md`, push se não
confirmado no passo 3).
