---
name: design
description: >
  Auditoria de UI para produtos Garlic: acha o "visual de IA" e os desvios do
  design system (@banana/ui, tokens, i18n, elevation em vez de borda, estados),
  roda um lint mecânico e aplica correções com tokens. Use quando o usuário
  digitar /garlic:design, ou pedir "auditar a UI", "tirar cara de IA",
  "polir a tela", "revisar o design", ou depois de terminar uma tela nova.
---

Auditoria e polimento de UI **dentro da arquitetura Garlic**. Inspirado no
Impeccable (impeccable.style), mas sem depender dele: as regras aqui são as da
casa (`project/DESIGN.md` do frontend) e valem pra qualquer produto criado com
o template. Quem tem o Impeccable instalado pode usar os dois; este skill não
conflita.

Melhor momento: **depois** de a tela estar funcionando. Não é gerador de tela.

## 0. Contexto antes de julgar

1. Ler `<frontend>/project/DESIGN.md` (tokens, princípios, estados) e, se
   existir, `PRD.md`/`PRODUCT.md`: público e tom decidem o que é "certo".
2. Se `DESIGN.md` não define identidade (só template), **dizer isso** e sugerir
   preencher antes de polir — sem direção, polimento vira gosto aleatório.
3. Escopo: a tela/feature pedida; sem pedido, o diff da branch atual.
   Escopo não é o app inteiro, salvo pedido.

## 1. Lint mecânico (rodar primeiro)

```
node ${CLAUDE_PLUGIN_ROOT}/skills/design/scripts/design-lint.mjs [pasta ...]
```
Sem argumento varre `apps/*/src` a partir do cwd. Regras: cor literal,
cor arbitrária, paleta padrão do Tailwind, gradiente em texto, blob/blur
decorativo, borda forte, `transition-all`, HTML cru de controle, `<img>` sem
alt, emoji como ícone, texto hardcoded (i18n), cor em `style` inline,
`font-size` em px no CSS.

- É heurística: pode haver falso positivo (ex.: gerador de paleta que
  *manipula* hex de propósito). Dado legítimo → `// design-lint-ignore` na
  linha ou na anterior, **com motivo**.
- Corrigir achado real trocando por **token ou componente do `@banana/ui`**;
  se o token/componente não existir, criar no design system primeiro (regra
  da casa), nunca contornar com valor literal.
- Erro/sucesso/aviso precisam de token semântico. Se não existir, propor
  criar em vez de repetir `red-500`.

## 2. Julgamento (o que regex não pega)

Olhar a tela rodando (Storybook ou dev server) nos **dois temas** e checar:

**Cara de IA**
- Hero/painel genérico: título grande + subtítulo + dois botões, sem ponto de vista.
- Grade de 3 cards iguais com ícone em círculo + título + frase.
- Tudo centralizado; tudo com o mesmo raio, mesma sombra, mesmo peso.
- Cartão dentro de cartão; borda + sombra + fundo juntos no mesmo bloco.
- Chips/badges demais ("sopa de status"); cor usada pra tudo, nada se destaca.
- Textos vagos ("Saiba mais", "Comece agora", "Soluções inovadoras") e
  placeholder genérico ("Lorem", "John Doe", "Acme").
- Paleta padrão (roxo→azul, bege "quente" sem motivo), fonte padrão sem escolha.

**Hierarquia e tipografia**
- Existe **uma** coisa principal por tela? Escala tipográfica consistente?
- Linha de leitura ≤ ~65 caracteres; títulos com `text-wrap: balance`;
  números alinhados (`tabular-nums`) em tabelas/valores.

**Estados (o que mais separa produto de protótipo)**
- Loading, erro (`RepositoryError` tipado, mensagem útil), vazio (com próxima
  ação), sucesso, desabilitado, foco visível.
- Formulário: erro ao lado do campo, não só toast.

**Layout e responsivo**
- Funciona em ~400px; sem scroll horizontal; alvos de toque ≥ 44px.
- Espaçamento por escala (`--spacing-*`), não valores soltos.

**Tema e acessibilidade**
- Contraste AA nos dois temas; nada que só funciona no claro.
- Navegável por teclado; ícone-botão com `aria-label`.
- `motion` só em transição essencial; respeitar `prefers-reduced-motion`.

**Da casa (Garlic)**
- Elevation em vez de borda; sem string hardcoded; sem HTML cru; texto via i18n.

## 3. Corrigir

- Corrigir o que for objetivo (lint, tokens, estados faltando, alt, i18n).
- Mudança de **direção visual** (cor da marca, fonte, layout de página) é do
  usuário: propor com 1–2 alternativas, não aplicar sozinho. Em site de cliente
  ao vivo, validar em localhost antes do push.
- Sem inventar componente fora do `@banana/ui`; sem biblioteca nova.

## 4. Reportar

1. Contagem do lint antes → depois.
2. Lista curta do que foi corrigido (arquivo:linha).
3. Julgamento: no máximo 5 itens, do mais impactante ao menos, cada um com a
   correção sugerida.
4. O que ficou pendente e depende do usuário (decisão de marca, componente
   novo no design system).
