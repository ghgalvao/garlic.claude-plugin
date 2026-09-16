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

1. **Clonar os 5 repos** no diretório atual, renomeando já no clone:
   ```
   mkdir -p <produto> && cd <produto>
   git clone https://gitlab.com/planodeominacao/garlic.frontend.git <produto>.frontend
   git clone https://gitlab.com/planodeominacao/garlic.infra.git <produto>.infra
   git clone https://gitlab.com/planodeominacao/garlic.automations.git <produto>.automations
   git clone https://gitlab.com/planodeominacao/garlic.backend.git <produto>.backend
   git clone https://gitlab.com/planodeominacao/garlic.docs.git <produto>.docs
   ```

2. **Cortar a história** de cada uma das 5 pastas:
   ```
   rm -rf .git && git init -q && git add -A
   git commit -q -m "Initial commit: <produto>.<parte> (a partir do template Garlic)"
   ```
   Perguntar nome/e-mail git do dev **antes**, configurar `--local` em cada
   repo — nunca mexer na config global do git.

3. **Perguntar** se o dev já quer criar os remotes novos (GitLab/GitHub) e
   dar push (branch `master` + branch `develop` a partir dela). Só fazer se
   confirmado — não assumir, não criar remote sem o dev ter os 5 projetos
   vazios prontos do outro lado.

4. **Corrigir o `.code-workspace`**: dentro de `<produto>.docs`, renomear
   `garlic.code-workspace` → `<produto>.code-workspace`, trocar os 4 paths
   (`../garlic.<parte>` → `../<produto>.<parte>`) e o `typescript.tsdk`.
   Confirmar abrindo o arquivo depois.

5. **Parar aqui** — não fazer o rebrand de conteúdo (cores/strings/copy)
   automaticamente, isso é decisão separada do dev (ver
   `<produto>.docs/GETTING_STARTED.md` §Rebrand quando ele quiser seguir).

Se algum dos 5 repos clonados tiver `.agent/workflows/bootstrap-new-product.md`
(normalmente em `<produto>.docs`), usar como referência/conferência do
processo acima — não repetir do zero se já bater com o que está descrito aqui.

Ao final, reportar exatamente o que foi feito (passos 1-4) e o que ficou
pendente (rebrand de conteúdo, Notion via `bootstrap-notion.md`, push se não
confirmado no passo 3).
