---
name: rebrand
description: >
  Aplica identidade de marca (5 cores + 2 fontes) num produto já clonado e
  renomeado pelo /garlic:new. Use quando o usuário digitar /garlic:rebrand,
  colar o prompt gerado pela landing page (Começar → gerador), ou pedir
  "aplicar rebrand"/"trocar cor e fonte do produto".
---

Aplica cor e fonte no produto `<produto>` (repo `<produto>-frontend`, já
clonado **e renomeado** pelo `/garlic:new` — pasta `apps/<produto>`,
`--color-<produto>-*`, nada de "garlic" deveria sobrar). Valores exatos vêm
em `args` (5 hex de cor, fonte sans, fonte mono) — nunca escolher cor/fonte
por conta própria nem pedir confirmação de gosto, os valores já são a
decisão do dev.

**Escopo mudou em 2026-09-25:** este skill só decide **marca** (cor/fonte).
Nome do produto (pasta, prefixo de CSS, arquivos `.csproj`/`.sln`, strings
"garlic") é responsabilidade do `/garlic:new` agora, roda sempre — não
depende do dev ter decidido cor/fonte ainda. Se `apps/<produto>` não existir
(ainda tem `apps/garlic`), o `/garlic:new` não rodou o passo de rename —
parar e apontar isso, não fazer o rename aqui como fallback (duplicaria
lógica em dois skills).

## 1. Gerar o `globals.css` — reusar a lógica existente, nunca reimplementar

`apps/<produto>/src/features/ui/guide/branding/generateGlobalsCss.ts` já faz
toda a matemática de escala/contraste (`colorScale.ts`) — chamar essa função
de verdade via script temporário, nunca recalcular cor/contraste na mão.

**Path sempre resolvido programaticamente, nunca `../../..` contado na
mão** — colocar o script na RAIZ do repo (`<produto>-frontend/`) e usar
`fileURLToPath(import.meta.url)` + `path.dirname()` pra achar essa raiz;
dali em diante só caminho pra BAIXO (conhecido, documentado), nunca subida
contada:

```js
// <produto>-frontend/_rebrand-tmp.mjs — apagar no fim deste passo
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { generateGlobalsCss } from './apps/<produto>/src/features/ui/guide/branding/generateGlobalsCss.ts'

const repoRoot = dirname(fileURLToPath(import.meta.url))
const targetPath = join(repoRoot, 'packages/banana-ui/src/styles/globals.css')

const css = generateGlobalsCss({
  primaryHex: '<hex>', secondaryHex: '<hex>', backgroundHex: '<hex>',
  headingHex: '<hex>', subtitleHex: '<hex>',
  sansFont: '<fonte sans>', monoFont: '<fonte mono>',
})
writeFileSync(targetPath, css, 'utf-8')
console.log('written to', targetPath)
```

Rodar de dentro de `<produto>-frontend`: `npx tsx _rebrand-tmp.mjs` (o repo
já usa `tsx` pra dry-run real dessa mesma lógica). Apagar `_rebrand-tmp.mjs`
depois — nunca commitar script temporário.

## 2. Sincronizar a fonte no `index.html`

`apps/<produto>/index.html` — o `<link>` do Google Fonts
(`fonts.googleapis.com/css2?family=...`) tem que casar com a fonte
sans/mono escolhida, senão fica dessincronizado do `globals.css` regenerado
(o app carrega uma fonte, o CSS pede outra). Reescrever a query `family=`
com as 2 fontes exatas de `args`. Se sobrar um `<link>` de fonte que não é
nem a sans nem a mono escolhida (leftover de uma rodada anterior), remover.

## 3. Verificar — obrigatório antes de reportar sucesso

```
pnpm build   # em <produto>-frontend
```
Não reportar rebrand como concluído sem isso passar verde. Se falhar, é
sinal de algo no passo 1-2 saiu errado (import quebrado no script temporário,
path de CSS desatualizado) — investigar antes de reportar.

Ao final, reportar exatamente o que foi trocado (cores, fontes) e confirmar
que `pnpm build` passou.
