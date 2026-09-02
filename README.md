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
o prompt do comando já embute os passos, não depende de ter clonado
`garlic.docs` antes só pra ler a receita.

```
/garlic:new foodpdv
```

## Instalar

(preencher depois de validar o mecanismo de instalação local do Claude Code
pra plugin — marketplace local vs `.claude/plugins/` direto)

## Estrutura

```
.claude-plugin/
  plugin.json        # manifesto — nome, hooks
  marketplace.json    # pra listar num marketplace, se um dia publicar
commands/
  new.toml            # /garlic:new
hooks/
  garlic-detect.js    # SessionStart
```
