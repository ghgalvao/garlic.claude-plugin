---
name: task-start
description: >
  Marca o início de uma task (nome + timestamp + baseline de tokens da
  sessão), pra medir depois com /garlic:task-end. Use quando o usuário
  digitar /garlic:task-start <nome>, ou pedir "começar a medir essa task"/
  "marcar início da tarefa".
---

Marca o início de uma task pra medir tempo + tokens depois com
`garlic:task-end`. Nome da task vem em `args` — se vazio, perguntar antes de
continuar. Só 1 task ativa por vez (chamar `task-start` de novo sobrescreve
a anterior sem avisar — se já tinha uma ativa e não foi fechada com
`task-end`, avisar antes de sobrescrever).

Rodar via Bash (o script real é quem mede — nunca estimar tempo/token no
próprio texto da resposta):

```bash
node -e '
const fs=require("fs"),os=require("os"),path=require("path");
const claudeDir=process.env.CLAUDE_CONFIG_DIR||path.join(os.homedir(),".claude");
function findRecentSession(){
  const projectsDir=path.join(claudeDir,"projects");
  let best=null,stack=[];
  try{stack=fs.readdirSync(projectsDir).map(e=>path.join(projectsDir,e))}catch{return null}
  while(stack.length){
    const p=stack.pop();let st;try{st=fs.statSync(p)}catch{continue}
    if(st.isDirectory()){try{for(const c of fs.readdirSync(p))stack.push(path.join(p,c))}catch{}}
    else if(p.endsWith(".jsonl")&&(!best||st.mtimeMs>best.mtime))best={file:p,mtime:st.mtimeMs};
  }
  return best?best.file:null;
}
function sumTokens(file){
  let out=0,cache=0,model=null;
  if(!file)return{out,cache,model};
  for(const line of fs.readFileSync(file,"utf8").split("\n")){
    if(!line.trim())continue;let e;try{e=JSON.parse(line)}catch{continue}
    if(e.type!=="assistant"||!e.message||!e.message.usage)continue;
    out+=e.message.usage.output_tokens||0;
    cache+=e.message.usage.cache_read_input_tokens||0;
    if(!model&&e.message.model)model=e.message.model;
  }
  return{out,cache,model};
}
const session=findRecentSession();
const{out,cache,model}=sumTokens(session);
const flagPath=path.join(claudeDir,".garlic-task-active.json");
if(fs.existsSync(flagPath))console.error("AVISO: já existia uma task ativa (",JSON.parse(fs.readFileSync(flagPath,"utf8")).task,") — sobrescrevendo sem fechar.");
const flag={task:process.argv[1],startedAt:new Date().toISOString(),sessionFile:session,startOutputTokens:out,startCacheReadTokens:cache,model};
fs.writeFileSync(flagPath,JSON.stringify(flag,null,2));
console.log("Task iniciada: "+flag.task+" @ "+flag.startedAt);
' "<nome-da-task>"
```

Reportar só a confirmação de início (nome + horário) — não inventar
duração/token nesse momento, isso só existe no `task-end`.
