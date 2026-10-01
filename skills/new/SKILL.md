---
name: new
description: >
  Bootstrapar um produto novo a partir do template Garlic (lê ou gera o
  .code-workspace, clona só os repos que ele lista, corta o histórico git,
  cria a branch develop). Use quando o usuário digitar /garlic:new <produto>,
  ou pedir pra "iniciar um produto novo com o Garlic" / "bootstrapar em cima
  do template".
---

Bootstrapar um produto novo a partir do template Garlic. O nome do produto
vem em `args` (texto digitado depois de `/garlic:new`) — se vazio, e não
houver um `.code-workspace` em `$BASE` pra extrair o nome, perguntar antes de
continuar (minúsculo, sem espaço).

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

1. **Garantir que existe um `.code-workspace` correto em `$BASE` (diretório
   atual), e clonar só os repos que ele lista.** **Mudança de 2026-10-01:** o
   workspace file passou a ser a fonte única de verdade de quais repos este
   produto usa — gerado ANTES de clonar (pela landing page, `Começar`, ou
   aqui mesmo se o dev não passou por ela), nunca mais corrigido DEPOIS
   (eliminou o passo frágil de "renomear + trocar 4 paths" que já ficou
   errado sem ninguém notar, lição de 2026-09-25).
   ```
   BASE="$(pwd)"
   ```
   Capturar isso primeiro — é a pasta onde o dev já está (se veio da landing,
   ele já criou a pasta, salvou e abriu o arquivo antes de rodar este
   comando; se não veio, é só a pasta atual mesmo).

   1.1. **Checar se já existe `*.code-workspace` em `$BASE`:**
   - **Existe** (fluxo normal, veio da landing) → ler o JSON, extrair de
     `folders[].path` quais `<parte>` foram escolhidas (cada path é
     `<produto>-<parte>`) e o `<produto>` (prefixo antes do primeiro `-`).
     `docs` TEM que estar na lista — se não estiver, avisar o dev e incluir
     mesmo assim, nunca pular (é o cérebro que ancora os outros repos).
   - **Não existe** (dev rodou o comando direto, sem passar pela landing) →
     perguntar nome do produto + quais dos 5 repos ele quer (default: todos;
     `docs` não é opcional) e **gerar o arquivo agora**, em
     `$BASE/<produto>.code-workspace`, no MESMO formato que a landing gera
     (`garlic.landing`'s `GarlicGenerator.buildWorkspaceFile` — nunca
     divergir desse formato):
     ```json
     {
       "folders": [
         { "name": "🧠 docs", "path": "<produto>-docs" },
         { "name": "🖥️ frontend", "path": "<produto>-frontend" }
       ],
       "settings": {
         "editor.formatOnSave": true,
         "editor.defaultFormatter": "esbenp.prettier-vscode",
         "files.exclude": { "**/node_modules": true, "**/dist": true, "**/bin": true, "**/obj": true },
         "search.exclude": { "**/node_modules": true, "**/dist": true, "**/pnpm-lock.yaml": true }
       },
       "extensions": { "recommendations": ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"] }
     }
     ```
     (exemplo só com docs+frontend — cresce conforme a seleção: emoji por
     parte é 🧠 docs, 🖥️ frontend, 🛠️ infra, 🕷️ automations, 🔧 backend;
     `typescript.tsdk: "<produto>-frontend/node_modules/typescript/lib"`
     entra em `settings` só se `frontend` estiver escolhido;
     `bradlc.vscode-tailwindcss` só se `frontend`, `denoland.vscode-deno` só
     se `infra`, `ms-dotnettools.csdevkit` só se `backend`.)

   1.2. **Clonar só os repos da lista**, direto em `$BASE` — nunca criar
   subpasta nova (se o arquivo já existia, o dev já fez a pasta certa):
   ```
   git clone https://gitlab.com/planodeominacao/garlic.<parte>.git "$BASE/<produto>-<parte>"
   ```
   Repetir só pras `<parte>` presentes no workspace file.

   **Cwd fica pendurado em `$BASE` entre chamadas de tool** (Bash persiste
   diretório entre execuções) — nunca assumir que voltou pra raiz sozinho.
   Todo passo seguinte abre com `cd "$BASE/<produto>-<parte>"` **absoluto**,
   nunca `cd <produto>-<parte>` relativo.

2. **Cortar a história** de cada repo clonado, a partir de `$BASE` (só os
   presentes no workspace, não mais fixo em 5):
   ```
   cd "$BASE/<produto>-frontend" && rm -rf .git && git init -q && git add -A \
     && git commit -q -m "Initial commit: <produto>-frontend (a partir do template Garlic)" \
     && git log --oneline
   ```
   Repetir pra cada repo presente, sempre abrindo com
   `cd "$BASE/<produto>-<parte>"` absoluto primeiro. Perguntar nome/e-mail
   git do dev **antes**, configurar `--local` em cada repo — nunca mexer na
   config global do git.

   **Verificar cada uma:** `git log --oneline` do comando acima deve mostrar
   **exatamente 1 commit**. Mais que isso = cwd errado (rodou dentro do repo
   errado, ou repetiu um já cortado) — causa mais provável, conferir `pwd`
   antes de tentar de novo.

3. **Perguntar** se o dev já quer criar os remotes novos (GitLab/GitHub) e
   dar push. **`<produto>-docs` é sempre só `master`, nunca cria `develop`**
   — é documentação/cérebro vivo, não passa por pipeline de release, não
   segue gitflow. Os outros repos presentes (`-frontend`, `-infra`,
   `-automations`, `-backend`) recebem `master` + branch `develop` a partir
   dela. Só fazer push se confirmado — não assumir, não criar remote sem o
   dev ter os projetos vazios prontos do outro lado. **Confirmar que o slug
   dos projetos remotos usa hífen** (`<produto>-frontend`, etc) — se o dev já
   criou com outro separador, usar o mesmo separador em TUDO daqui pra
   frente, não misturar.

4. **Verificação rápida do workspace** — mais leve que antes, porque o
   arquivo já nasceu certo no passo 1.1 (veio pronto da landing, ou foi
   gerado aqui mesmo já com os paths certos — não tem mais "renomear depois"
   pra verificar). Só confirmar que resolve de verdade, a partir de `$BASE`:
   ```
   node -e '
     const fs = require("fs");
     const path = require("path");
     const ws = JSON.parse(fs.readFileSync("<produto>.code-workspace", "utf-8"));
     let bad = 0;
     for (const f of ws.folders) {
       if (!fs.existsSync(path.resolve(f.path))) { console.error("QUEBRADO:", f.path); bad++; }
     }
     if (ws.settings["typescript.tsdk"]) {
       const tsdkRoot = ws.settings["typescript.tsdk"].split("/node_modules/")[0];
       if (!fs.existsSync(path.resolve(tsdkRoot))) { console.error("QUEBRADO: typescript.tsdk ->", tsdkRoot); bad++; }
     }
     process.exit(bad ? 1 : 0);
   '
   ```
   Saiu `QUEBRADO` em qualquer linha = o nome clonado no passo 1.2 não bate
   com o path do arquivo — corrigir antes de seguir, nunca reportar este
   passo como concluído com esse comando falhando.

5. **Renomear todo vestígio interno de "garlic"** — isto é identidade
   técnica (nome), não marca (cor/fonte). Não espera o dev decidir cor/fonte
   pra acontecer; roda sempre, aqui, porque o nome do produto já é conhecido
   desde o passo 1. **Lição de 2026-09-24/25 (Jocati SaaS):** essa etapa
   morava no `/garlic:rebrand` antigo e ficava sem rodar até o dev pedir
   rebrand — produto ficava com pasta/CSS/backend ainda chamados "garlic" por
   dias, e o grep de verificação era case-sensitive (`grep -rn "Garlic"`),
   nunca pegava a esmagadora maioria das ocorrências reais (minúsculas,
   kebab-case). Agora: sempre roda aqui, grep sempre `-i`, escopo nos repos
   presentes (lidos do workspace file no passo 1, não mais fixo em 5).

   5.1. **Pasta e arquivos que carregam "garlic" no nome** — antes de
   qualquer grep de conteúdo, porque nome de pasta/arquivo já é vestígio.
   **Só roda a parte de `-frontend` se frontend estiver presente, só a parte
   de `-backend` se backend estiver presente** — produto sem frontend não
   tem `apps/garlic` pra renomear.
   ```
   # em <produto>-frontend, SE presente
   git mv apps/garlic apps/<produto>
   git mv apps/<produto>/src/app/styles/garlic-theme.css apps/<produto>/src/app/styles/theme.css
   ```
   Atualizar o `@import` em `apps/<produto>/src/index.css` pro novo nome do
   arquivo, e qualquer path hardcoded pra `apps/garlic` nos `.md` do repo
   (`CLAUDE.md`, `README.md`, `project/*.md`).
   ```
   # em <produto>-backend, SE presente
   git mv Garlic.Backend.csproj <Produto>.Backend.csproj
   git mv Garlic.Backend.sln <Produto>.Backend.sln
   git mv Garlic.Backend.http <Produto>.Backend.http
   ```
   (`<Produto>` em PascalCase pro `.sln`/`.csproj` — convenção .NET.) Trocar
   a string `Garlic.Backend` pra `<Produto>.Backend` dentro do `.sln` e do
   `.http`.

   5.2. **Toda string "garlic" nos repos presentes — 1 script em lote, não
   busca manual arquivo por arquivo.** **Lição de 2026-09-28 (teste
   `promonelson`):** a versão anterior deste passo listava ~10 categorias
   pra caçar na mão (variável CSS, classe Tailwind, animação, localStorage,
   rota Vite, `package.json`, traduções, `index.html`, fixture de dev,
   comentário) — virava 30+ tool calls de edição individual, e o agente
   abandonava no meio sem terminar (reportava sucesso ou simplesmente parava
   antes do passo 6). Isso sozinho já cobre a esmagadora maioria — TODA
   string "garlic" nos repos presentes, incluindo tudo daquela lista antiga,
   sem precisar enumerar categoria por categoria:
   ```
   for repo in <lista de <produto>-<parte> presentes>; do
     cd "$BASE/$repo"
     files=$(grep -rIl "garlic" --exclude-dir=node_modules --exclude-dir=.git \
       --exclude-dir=bin --exclude-dir=obj --exclude="pnpm-lock.yaml" \
       --exclude="package-lock.json" -i .)
     echo "$files" | while IFS= read -r f; do
       [ -z "$f" ] && continue
       sed -i 's/Garlic\.Backend/<Produto>.Backend/g; s/Garlic/<Produto>/g; s/garlic/<produto>/g' "$f"
     done
   done
   ```
   **Única exceção que o replace em lote quebra, corrigir logo depois (só se
   frontend presente):** o arquivo `theme.css` (renomeado no passo 5.1 SEM
   prefixo de produto, de propósito) tem seu próprio nome citado em
   prosa/import em vários lugares (`index.css`, `DESIGN.md`, traduções da
   GuidePage, `.design-sync/NOTES.md`) — o sed acima transforma essas
   citações em `<produto>-theme.css`, que não existe. Corrigir por cima, em
   `<produto>-frontend`:
   ```
   cd "$BASE/<produto>-frontend"
   sed -i 's/<produto>-theme\.css/theme.css/g' $(grep -rIl "<produto>-theme.css" --exclude-dir=node_modules --exclude-dir=.git .)
   ```
   `<Produto>` em PascalCase casa sozinho com `Garlic.Backend`→`<Produto>.Backend`
   (`.sln`/`.csproj`/`.http`) porque o sed roda essa troca primeiro, antes do
   replace genérico de "Garlic". Convenção de hífen nos nomes de repo
   (`<produto>-docs`, etc) já sai certa do replace porque o texto de origem já
   usa hífen (`garlic.frontend` → vira `<produto>.frontend` se a fonte já
   citava com ponto, `garlic-frontend` → `<produto>-frontend` se já era
   hífen — o replace preserva o separador que já estava escrito, não
   precisa tratar à parte).

   5.3. **Verificar — obrigatório antes de seguir pro passo 6:**
   ```
   grep -rni "garlic" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=bin --exclude-dir=obj --exclude="pnpm-lock.yaml" --exclude="package-lock.json" .
   ```
   rodado em cada repo presente **tem que voltar vazio** — critério de
   sucesso é o grep zerado, não "rodei o script". Depois, só os builds dos
   repos que existem:
   ```
   pnpm install && pnpm build   # em <produto>-frontend, SE presente
   dotnet build                 # em <produto>-backend, SE presente
   ```
   Não reportar este passo como concluído sem grep vazio e os builds
   aplicáveis verdes. Se `pnpm build` falhar em "Can't resolve './app/styles/<produto>-theme.css'",
   é a exceção do `theme.css` acima não aplicada — rodar de novo.

6. **Instruir o dev a abrir o workspace, se ainda não abriu.** Fluxo normal
   (veio da landing, passo 1.1 achou o arquivo pronto): ele já abriu ANTES de
   rodar esse comando — só confirmar no report que é a mesma pasta. Fluxo
   clássico (passo 1.1 teve que gerar o arquivo agora): instruir a abrir
   agora — `File → Open Workspace from File…` → `<produto>.code-workspace`
   em `$BASE`. Nunca abrir só uma das pastas soltas (perde a navegação
   multi-root entre os repos presentes — frontend/infra/
   automations/backend/docs).

7. **Parar aqui** — não escolher cor/fonte automaticamente, isso é decisão
   de marca separada do dev (o nome já foi resolvido no passo 5, não
   depende disso). Quando ele quiser aplicar cor/fonte: skill
   `garlic:rebrand` (mesmo plugin).

Se algum dos repos clonados tiver `.agent/workflows/bootstrap-new-product.md`
(normalmente em `<produto>-docs`), usar como referência/conferência do
processo acima — não repetir do zero se já bater com o que está descrito aqui.

Ao final, reportar exatamente o que foi feito (passos 1-6), **destacar o
comando pra abrir o workspace** (`File → Open Workspace from File…` →
`<produto>.code-workspace`, na pasta `$BASE`), e o que ficou pendente (cor/fonte
via `/garlic:rebrand`, Notion via `bootstrap-notion.md`, push se não
confirmado no passo 3).
