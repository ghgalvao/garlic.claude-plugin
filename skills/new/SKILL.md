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
   dar push. **`<produto>-docs` é sempre só `master`, nunca cria `develop`**
   — é documentação/cérebro vivo, não passa por pipeline de release, não
   segue gitflow. Os outros 4 (`-frontend`, `-infra`, `-automations`,
   `-backend`) recebem `master` + branch `develop` a partir dela. Só fazer
   push se confirmado — não assumir, não criar remote sem o dev ter os 5
   projetos vazios prontos do outro lado. **Confirmar que o slug dos 5
   projetos remotos usa hífen** (`<produto>-frontend`, etc) — se o dev já
   criou com outro separador, usar o mesmo separador em TUDO daqui pra
   frente (passo 4 incluso), não misturar.

4. **Corrigir o `.code-workspace`**: dentro de `<produto>-docs`, renomear
   `garlic.code-workspace` → `<produto>.code-workspace`, trocar os 4 paths
   (`../garlic.<parte>` → `../<produto>-<parte>`) e o `typescript.tsdk`.

   **Verificar de forma automática, não visual** — abrir o arquivo e "olhar"
   já falhou antes (lição de 2026-09-25: essa etapa ficou errada em mais de
   um produto criado antes desta correção, sem ninguém notar até abrir o
   editor). Rodar de verdade, a partir de `$BASE/<produto>-docs`:
   ```
   node -e '
     const fs = require("fs");
     const path = require("path");
     const ws = JSON.parse(fs.readFileSync("<produto>.code-workspace", "utf-8"));
     let bad = 0;
     for (const f of ws.folders) {
       if (!fs.existsSync(path.resolve(f.path))) { console.error("QUEBRADO:", f.path); bad++; }
     }
     // tsdk aponta pra dentro de node_modules, que só existe depois do
     // pnpm install — checar só a pasta raiz referenciada, não o caminho
     // inteiro (senão falso-positivo antes do install rodar).
     const tsdkRoot = ws.settings["typescript.tsdk"].split("/node_modules/")[0];
     if (!fs.existsSync(path.resolve(tsdkRoot))) { console.error("QUEBRADO: typescript.tsdk ->", tsdkRoot); bad++; }
     process.exit(bad ? 1 : 0);
   '
   ```
   Saiu `QUEBRADO` em qualquer linha = path errado, corrigir antes de seguir
   — nunca reportar este passo como concluído com esse comando falhando.
   (Testado 2026-09-25 contra `jocatisaas.code-workspace` real: pega o caso
   quebrado — path com ponto que não existe — e passa limpo no caso certo.)

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

   5.2. **Toda string "garlic" nos 5 repos — 1 script em lote, não busca
   manual arquivo por arquivo.** **Lição de 2026-09-28 (teste `promonelson`):**
   a versão anterior deste passo listava ~10 categorias pra caçar na mão
   (variável CSS, classe Tailwind, animação, localStorage, rota Vite,
   `package.json`, traduções, `index.html`, fixture de dev, comentário) —
   virava 30+ tool calls de edição individual, e o agente abandonava no meio
   sem terminar (reportava sucesso ou simplesmente parava antes do passo 6).
   Isso sozinho já cobre a esmagadora maioria — TODA string "garlic" nos 5
   repos, incluindo tudo daquela lista antiga, sem precisar enumerar
   categoria por categoria:
   ```
   for repo in <produto>-frontend <produto>-infra <produto>-automations <produto>-backend <produto>-docs; do
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
   **Única exceção que o replace em lote quebra, corrigir logo depois:** o
   arquivo `theme.css` (renomeado no passo 5.1 SEM prefixo de produto, de
   propósito) tem seu próprio nome citado em prosa/import em vários lugares
   (`index.css`, `DESIGN.md`, traduções da GuidePage, `.design-sync/NOTES.md`)
   — o sed acima transforma essas citações em `<produto>-theme.css`, que não
   existe. Corrigir por cima, em `<produto>-frontend`:
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
   rodado em cada um dos 5 repos **tem que voltar vazio** — critério de
   sucesso é o grep zerado, não "rodei o script". Depois:
   ```
   pnpm install && pnpm build   # em <produto>-frontend
   dotnet build                 # em <produto>-backend
   ```
   Não reportar este passo como concluído sem grep vazio e os dois builds
   verdes. Se `pnpm build` falhar em "Can't resolve './app/styles/<produto>-theme.css'",
   é a exceção do `theme.css` acima não aplicada — rodar de novo.

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
