---
name: rebrand
description: >
  Aplica rebrand de marca (5 cores + 2 fontes + nome do produto) num repo
  <produto>.frontend já clonado pelo /garlic:new. Use quando o usuário digitar
  /garlic:rebrand, colar o prompt gerado pela landing page (Começar → gerador),
  ou pedir "aplicar rebrand"/"trocar cor e fonte do Garlic pro produto novo".
---

Aplica o rebrand de marca no produto `<produto>` (repo `<produto>.frontend`,
já clonado pelo `/garlic:new`). Valores exatos vêm em `args` (nome do
produto, 5 hex de cor, fonte sans, fonte mono) — nunca escolher cor/fonte por
conta própria nem pedir confirmação de gosto, os valores já são a decisão do
dev.

## 1. Gerar o `globals.css` — reusar a lógica existente, nunca reimplementar

`apps/garlic/src/features/ui/guide/branding/generateGlobalsCss.ts` já faz
toda a matemática de escala/contraste (`colorScale.ts`) — chamar essa função
de verdade via script temporário, nunca recalcular cor/contraste na mão.

**Path sempre resolvido programaticamente, nunca `../../..` contado na
mão** — colocar o script na RAIZ do repo (`<produto>.frontend/`) e usar
`fileURLToPath(import.meta.url)` + `path.dirname()` pra achar essa raiz;
dali em diante só caminho pra BAIXO (conhecido, documentado), nunca subida
contada:

```js
// <produto>.frontend/_rebrand-tmp.mjs — apagar no fim do passo 1
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { generateGlobalsCss } from './apps/garlic/src/features/ui/guide/branding/generateGlobalsCss.ts'

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

Rodar de dentro de `<produto>.frontend`: `npx tsx _rebrand-tmp.mjs`
(o repo já usa `tsx` pra dry-run real dessa mesma lógica — ver
`project/lessons/lessons.md` 2026-08-21). Apagar `_rebrand-tmp.mjs` depois —
nunca commitar script temporário.

## 2. Trocar a string "Garlic" em todo lugar hardcoded

Não é só 2 chaves — grep primeiro pra achar todas as ocorrências, não confiar
numa lista fixa:
```
grep -rn "Garlic" apps/garlic/src apps/garlic/index.html
```
Cobre pelo menos:
- `features/ui/*/translations/*.json` — chaves `header.brand`/`shared.brand`
  e qualquer outra ocorrência literal de "Garlic" no dicionário.
- `apps/garlic/index.html` — `<title>Garlic</title>` → `<title><produto></title>`.
- `apps/garlic/index.html` — o `<link>` do Google Fonts (`fonts.googleapis.com/css2?family=...`)
  tem que casar com a fonte sans/mono escolhida, senão fica dessincronizado
  do `globals.css` regenerado (o app carrega uma fonte, o CSS pede outra).
  Reescrever a query `family=` com as 2 fontes exatas de `args`. Se sobrar
  um `<link>` de fonte que não é nem a sans nem a mono escolhida (leftover),
  remover.

## 3. Fixture de dev

`app/config/supabase/fixtures.ts` e `app/config/supabase/mockClient.ts` têm
`dev@garlic.local` — trocar pro domínio do produto novo (`dev@<produto>.local`).

## 4. Verificar — obrigatório antes de reportar sucesso

```
pnpm build
```
Não reportar rebrand como concluído sem isso passar verde. Se falhar, é
sinal de algo no passo 1-3 saiu errado (import quebrado, string trocada num
lugar que não devia) — investigar antes de reportar.

Ao final, reportar exatamente o que foi trocado (cores, fontes, arquivos de
string, fixture) e confirmar que `pnpm build` passou.
