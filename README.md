# garlic.claude-plugin

Plugin do Claude Code pro workspace multi-repo **Garlic** (SaaS-starter da
G3 Software). Resolve dois momentos:

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
  new/SKILL.md        # /garlic:new — mecanismo real, é isso que o Claude Code lê
commands/
  new.toml            # /garlic:new — só compat cruzada (Gemini CLI etc), ignorado pelo Claude Code
hooks/
  garlic-detect.js    # SessionStart
```
