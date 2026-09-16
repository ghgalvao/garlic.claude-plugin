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

Executar de verdade via Bash (não só descrever), na ordem:

1. **Clonar os 5 repos** no diretório atual, renomeando já no clone, e
   capturar o diretório base logo depois:
   ```
   mkdir -p <produto> && cd <produto>
   git clone https://gitlab.com/planodeominacao/garlic.frontend.git <produto>.frontend
   git clone https://gitlab.com/planodeominacao/garlic.infra.git <produto>.infra
   git clone https://gitlab.com/planodeominacao/garlic.automations.git <produto>.automations
   git clone https://gitlab.com/planodeominacao/garlic.backend.git <produto>.backend
   git clone https://gitlab.com/planodeominacao/garlic.docs.git <produto>.docs
   BASE="$(pwd)"
   ```
   **Cwd fica pendurado em `$BASE` entre chamadas de tool** (Bash persiste
   diretório entre execuções) — nunca assumir que voltou pra raiz sozinho.
   Todo passo seguinte abre com `cd "$BASE/<produto>.<parte>"` **absoluto**,
   nunca `cd <produto>.<parte>` relativo.

2. **Cortar a história** de cada uma das 5 pastas, a partir de `$BASE`:
   ```
   cd "$BASE/<produto>.frontend" && rm -rf .git && git init -q && git add -A \
     && git commit -q -m "Initial commit: <produto>.frontend (a partir do template Garlic)" \
     && git log --oneline
   ```
   Repetir pras outras 4 (`.infra`, `.automations`, `.backend`, `.docs`),
   sempre abrindo com `cd "$BASE/<produto>.<parte>"` absoluto primeiro.
   Perguntar nome/e-mail git do dev **antes**, configurar `--local` em cada
   repo — nunca mexer na config global do git.

   **Verificar cada uma:** `git log --oneline` do comando acima deve mostrar
   **exatamente 1 commit**. Mais que isso = cwd errado (rodou dentro do repo
   errado, ou repetiu um já cortado) — causa mais provável, conferir `pwd`
   antes de tentar de novo.

3. **Perguntar** se o dev já quer criar os remotes novos (GitLab/GitHub) e
   dar push (branch `master` + branch `develop` a partir dela). Só fazer se
   confirmado — não assumir, não criar remote sem o dev ter os 5 projetos
   vazios prontos do outro lado.

4. **Corrigir o `.code-workspace`**: dentro de `<produto>.docs`, renomear
   `garlic.code-workspace` → `<produto>.code-workspace`, trocar os 4 paths
   (`../garlic.<parte>` → `../<produto>.<parte>`) e o `typescript.tsdk`.
   Confirmar abrindo o arquivo (conteúdo, não a UI) depois.

   **Instruir o dev, de forma explícita no report final, a abrir esse
   arquivo no editor** — `File → Open Workspace from File…` →
   `<produto>.docs/<produto>.code-workspace`. Nunca abrir só uma das 5
   pastas soltas (perde a navegação multi-root entre frontend/infra/
   automations/backend/docs).

5. **Parar aqui** — não fazer o rebrand de conteúdo (cores/strings/copy)
   automaticamente, isso é decisão separada do dev. Quando ele quiser seguir:
   skill `garlic:rebrand` (mesmo plugin) faz isso direito.

Se algum dos 5 repos clonados tiver `.agent/workflows/bootstrap-new-product.md`
(normalmente em `<produto>.docs`), usar como referência/conferência do
processo acima — não repetir do zero se já bater com o que está descrito aqui.

Ao final, reportar exatamente o que foi feito (passos 1-4), **destacar o
comando pra abrir o workspace** (`File → Open Workspace from File…` →
`<produto>.docs/<produto>.code-workspace`), e o que ficou pendente (rebrand
de conteúdo, Notion via `bootstrap-notion.md`, push se não confirmado no
passo 3).
