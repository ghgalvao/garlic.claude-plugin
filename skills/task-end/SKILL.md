---
name: task-end
description: >
  Fecha a medição aberta por /garlic:task-start — calcula duração e tokens
  gastos (dado real do transcript da sessão, não estimativa), documenta o
  resultado. Use quando o usuário digitar /garlic:task-end, ou pedir
  "fechar a task"/"quanto gastei nessa tarefa".
---

Fecha a medição de uma task aberta por `garlic:task-start`. Duração e token
sempre calculados por script (dado real do transcript), nunca estimados no
texto da resposta.

## 1. Calcular — via Bash

```bash
node -e '
const fs=require("fs"),os=require("os"),path=require("path");
const claudeDir=process.env.CLAUDE_CONFIG_DIR||path.join(os.homedir(),".claude");
const flagPath=path.join(claudeDir,".garlic-task-active.json");
if(!fs.existsSync(flagPath)){console.error("Nenhuma task ativa — rode /garlic:task-start primeiro.");process.exit(1)}
const flag=JSON.parse(fs.readFileSync(flagPath,"utf8"));
function sumTokens(file){
  let out=0,cache=0;
  if(!file||!fs.existsSync(file))return{out,cache};
  for(const line of fs.readFileSync(file,"utf8").split("\n")){
    if(!line.trim())continue;let e;try{e=JSON.parse(line)}catch{continue}
    if(e.type!=="assistant"||!e.message||!e.message.usage)continue;
    out+=e.message.usage.output_tokens||0;
    cache+=e.message.usage.cache_read_input_tokens||0;
  }
  return{out,cache};
}
const now=new Date();
const started=new Date(flag.startedAt);
const ms=now-started;
const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
const durationHuman=h>0?h+"h "+m+"min":(m>0?m+"min":s+"s");
const{out,cache}=sumTokens(flag.sessionFile);
const sessionContinuous=fs.existsSync(flag.sessionFile||"");
const result={
  task:flag.task, startedAt:flag.startedAt, endedAt:now.toISOString(),
  durationMs:ms, durationHuman,
  outputTokensDelta: sessionContinuous ? Math.max(0,out-flag.startOutputTokens) : null,
  cacheReadTokensDelta: sessionContinuous ? Math.max(0,cache-flag.startCacheReadTokens) : null,
  sessionContinuous,
};
console.log(JSON.stringify(result,null,2));
fs.unlinkSync(flagPath);
'
```

Se `sessionContinuous` vier `false` (arquivo de sessão sumiu/mudou — sessão
reiniciada no meio), reportar duração normalmente mas avisar que a contagem
de token não é confiável (baseline era de outra sessão) — nunca inventar um
número nesse caso.

## 2. Reportar na tela
Nome da task, início, fim, duração, tokens de output + cache-read gastos
(ou o aviso de descontinuidade, se for o caso).

## 3. Gravar no `task-master.md`
Achar a linha correspondente (match por nome/descrição da task) no
`task-master.md` relevante — do repo atual (`project/tasks/task-master.md`
ou `docs/task-master.md`) ou do workspace (`garlic.docs/task-master.md`) se
a task for cross-repo. Anexar ao final da linha, sem reescrever o resto:
` — ⏱ <duração> · 🪙 ~<tokens> tokens`. **Não achou a linha** (nome não bate
com nada existente)? Reportar o resultado e perguntar onde colar — nunca
criar uma entrada nova de task só pra caber a métrica.

## 4. Notion (best-effort, opcional)
Se houver MCP do Notion conectado nesta sessão E existir um board
correspondente (Kanban 🛠️ Desenvolvimento ou 📈 Estratégico de um HQ já
montado via `bootstrap-notion.md`), procurar a linha pelo nome da task e
gravar em **propriedade**, não comentário — schema definido em
`garlic.docs/notion/kanban.md`:
- `Duração` (rich_text) — mesmo texto humano do passo 2 (ex. "42min").
- `Tokens` (number) — soma de output + cache-read.

Se o board ainda não tiver essas 2 propriedades (HQ montado antes desta
skill existir), criar as colunas primeiro (mesmo tipo/nome do schema) — não
inventar nome diferente, não usar comentário como substituto silencioso.

Sem Notion conectado, ou sem task correspondente achada: pular esse passo
com uma nota, **nunca falhar o comando inteiro por causa disso** — os
passos 1-3 já entregam o essencial.
