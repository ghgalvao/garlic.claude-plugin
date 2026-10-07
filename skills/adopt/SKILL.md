---
name: adopt
description: >
  Adota um projeto JÁ EXISTENTE no jeito Garlic: traz a pasta docs (cérebro
  obrigatório) a partir do template, gera o .code-workspace apontando para as
  pastas que já existem e entrega as instruções para adicionar mais pastas.
  Use quando o usuário digitar /garlic:adopt <produto>, ou pedir "usar o
  Garlic num projeto existente", "adicionar o cérebro docs", "montar o
  workspace do jeito Garlic" sem querer clonar o template inteiro.
---

Adota um produto que **já tem código** (repos com qualquer nome, em qualquer
stack). Diferente de `/garlic:new`: não clona frontend/infra/backend do
template, não corta histórico dos repos existentes e **não renomeia nada neles**.
Só entrega o cérebro (`docs`) e o workspace multi-root.

O nome do produto vem em `args` (minúsculo, sem espaço). Se vazio, perguntar.

## 1. Mapear o que já existe

1. `BASE="$(pwd)"` — pasta que contém (ou vai conter) os repos. Se o usuário
   estiver dentro de um repo, usar a pasta pai.
2. Listar subpastas de `$BASE` com `.git` (repos candidatos) e mostrar ao
   usuário. Perguntar **uma vez** quais entram no workspace e o papel de cada
   (frontend, backend, infra, automations, outro). Repos fora de `$BASE` são
   aceitos por caminho absoluto/relativo.
3. **Não renomear** pastas existentes. O nome delas é o que vale no workspace.

## 2. Trazer o cérebro `docs` (obrigatório)

```
git clone https://gitlab.com/planodeominacao/garlic.docs.git "$BASE/<produto>-docs"
cd "$BASE/<produto>-docs" && rm -rf .git && git init -q && git add -A \
  && git commit -q -m "Initial commit: <produto>-docs (a partir do template Garlic)" && git log --oneline
```

Exatamente 1 commit; nome/e-mail git `--local` (perguntar antes). `docs` é só
`master`, nunca `develop`.

Se `<produto>-docs` já existir, **não sobrescrever**: ler o que tem e só
completar o que faltar (workspace, CLAUDE.md).

Depois limpar o que é do *template*, não do produto:
- trocar toda ocorrência de "garlic" (grep `-i`, escopo só em `<produto>-docs`)
  por `<produto>`/`<Produto>`;
- `PRD.md`, `CHANGELOG.md`, `RELEASES.md`, `design_handoff_garlic/` são do
  template: **perguntar** antes de apagar/zerar; sugerir esvaziar o `PRD.md`
  num esqueleto e preencher a partir do que o código existente já faz;
- manter `CLAUDE.md`, `AGENTS.md`, `README.md`, `task-master.md`,
  `GETTING_STARTED.md`, `specs/`, `notion/`.

Sugerir como primeira tarefa documentar o produto atual (arquitetura, stack,
como rodar, decisões) no `docs` — é o que dá valor ao cérebro num projeto que
já existe.

## 3. Gerar o `.code-workspace`

Em `$BASE/<produto>-docs/<produto>.code-workspace`. O docs usa `"."`; os demais
paths são **relativos ao docs** (ex. `../meu-front`). Mesmo formato do
`/garlic:new`, com os nomes reais:

```json
{
  "folders": [
    { "name": "🧠 docs", "path": "." },
    { "name": "🖥️ frontend", "path": "../<pasta-real-do-front>" },
    { "name": "🔧 backend", "path": "../<pasta-real-do-back>" }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "files.exclude": { "**/node_modules": true, "**/dist": true, "**/bin": true, "**/obj": true },
    "search.exclude": { "**/node_modules": true, "**/dist": true, "**/pnpm-lock.yaml": true }
  },
  "extensions": { "recommendations": [] }
}
```

Emoji por papel: 🖥️ frontend, 🛠️ infra, 🕷️ automations, 🔧 backend, 📁 outro.
Só incluir `typescript.tsdk` e as extensões (`esbenp.prettier-vscode`,
`dbaeumer.vscode-eslint`, `ms-dotnettools.csdevkit`…) se a stack existir.
Verificar que todo `path` resolve (`fs.existsSync(path.resolve(<docs>, f.path))`)
antes de reportar.

## 4. Fazer o hook reconhecer o workspace

O `garlic-detect.js` detecta repos fora do padrão `<produto>-<papel>` quando
existe uma pasta `*-docs`/`*.docs` irmã com um `.code-workspace` que liste o
repo atual. O arquivo do passo 3 basta — nada a configurar. Em cada repo
existente, sugerir (sem forçar) uma linha no `CLAUDE.md`/`AGENTS.md`
apontando para `../<produto>-docs`.

## 5. Reportar (instruções ao usuário)

- Abrir: **File > Open Workspace from File… > `<produto>-docs/<produto>.code-workspace`**
  (nunca abrir só uma pasta solta).
- **Adicionar outra pasta depois:** *File > Add Folder to Workspace…* e depois
  *File > Save Workspace As…* sobrescrevendo o mesmo arquivo; ou editar o JSON e
  acrescentar `{ "name": "<emoji> <papel>", "path": "../<pasta>" }` em `folders`.
- Reiniciar a sessão do Claude para o hook carregar o contexto dos repos.
- Pendências: preencher PRD/arquitetura no `docs`; `/garlic:ci` se o projeto
  ainda não tem deploy; `/garlic:rebrand` se quiser cor/fonte.
