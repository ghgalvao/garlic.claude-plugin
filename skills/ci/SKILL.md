---
name: ci
description: >
  Cria, ajusta ou diagnostica o CI/CD (GitLab → FTP em hospedagem Windows/IIS,
  ex.: hostazul) de um front estático (Vite/Astro) e/ou de uma API .NET:
  .gitlab-ci.yml, variáveis, appsettings gerado no deploy, web.config, limpeza
  do servidor e verificação no ar. Use quando o usuário digitar /garlic:ci,
  pedir "configurar o CI", "deploy automático", "pipeline", "variáveis do
  GitLab", ou relatar erro de deploy (550, 500.30, smtp_auth, config antiga
  sobrescrevendo a nova).
---

Configura (ou conserta) o deploy automático de um produto. Origem: sessão de
07/10/2026 no site e na API de um projeto de cliente, que custou horas por causa de erros
repetíveis — este skill existe pra o próximo produto não pagar isso de novo.

**Regra de ouro: segredo nunca entra no repositório.** Valores reais vivem só
nas variáveis do GitLab; o CI gera o `appsettings.json` na hora do deploy.

## 0. Antes de mexer

1. Ler o `.gitlab-ci.yml` existente (se houver) e os docs do produto
   (`<produto>.docs`) antes de propor qualquer coisa — não sobrescrever CI que
   já funciona sem entender o que ele faz.
2. Descobrir o escopo com o usuário (uma pergunta só, se faltar):
   - **front estático** (Vite/Astro → pasta `dist/`)?
   - **API .NET** (IIS in-process)?
   - **ambos** (repos separados, um pipeline por repo)?
3. **Push em `main`/`develop` publica de verdade.** Em site de cliente ao vivo,
   mudança *visual* só vai pro ar depois do usuário validar em localhost
   (preferência do autor do plugin). Mudança só de CI/config/documentação pode
   usar `[skip ci]` no commit pra não redeployar à toa.

## 1. Templates (copiar e adaptar, nunca reescrever do zero)

Em `${CLAUDE_PLUGIN_ROOT}/skills/ci/templates/`:

| Arquivo | Para quê |
|---|---|
| `static-site.gitlab-ci.yml` | Build (npm/pnpm) + deploy FTP de um front estático |
| `dotnet-api.gitlab-ci.yml` | Publish .NET + appsettings gerado + `app_offline.htm` + deploy FTP |
| `appsettings.Development.example.json` | Modelo versionado que **lista todas as variáveis** exigidas |
| `web.config` | IIS p/ site estático: gzip, cache, www → apex, 404 correto |
| `wait-deploy.sh` | Espera o deploy terminar (janela de manutenção) e checa o resultado |

Trocar os placeholders (`<produto>`, `<dominio>`) e **só então** copiar pro repo.

## 2. Variáveis do GitLab (Settings → CI/CD → Variables)

Em **todas**: *Protect variable* **desligado** (branch `main` não é protegida) e
*Expand variable reference* **desligado** (ligado, o GitLab trata `$` como
referência e corrompe a senha sem avisar). *Mask variable* **ligado** nas
senhas (exige 8+ caracteres, uma linha, sem espaços).

| Variável | Valor |
|---|---|
| `FTP_HOST`, `FTP_USER`, `FTP_PASS` | acesso FTP da hospedagem |
| `FTP_PATH` | pasta do site **vista pelo FTP** (não caminho de disco) |
| demais (`SMTP_*`, chaves de API…) | o que o `appsettings` do produto precisar |

O pipeline da API começa **validando** que todas existem e falha com o nome da
que faltou — isso evita deploy meio quebrado.

**`FTP_PATH`:** é relativo à raiz do usuário FTP. Pedir ao usuário que abra o
FileZilla e leia o "endereço remoto" da pasta onde o site/API já está. Se
errar e apontar pra pasta de outro site, o deploy joga arquivos lá dentro.

## 3. Front estático — o que importa

- `npm ci` (ou `pnpm install --frozen-lockfile`) → build → `lftp mirror -R`.
- Flags do lftp (todas necessárias nesse host): `ftp:ssl-force true`,
  `ssl:verify-certificate no`, `ftp:use-site-utime no`, `--no-perms` (IIS não
  suporta `SITE CHMOD`).
- **Sem `--delete`.** A pasta do servidor pode ter coisas que o build não
  conhece (outro site, e-mail). Limpeza só de arquivos antigos *conhecidos*,
  com `mrm` e padrão explícito, **depois** do upload e com `|| true` (nunca
  derruba o deploy). Atenção: curinga com espaço/acento no nome pode não casar
  (um PDF com acento no nome não foi apagado) — conferir no ar, apagar à mão
  se preciso.
- `public/web.config` (template): gzip, cache longo só em pasta com hash
  (`_astro`) e curto no resto, `www` → apex. O que **não** fazer:
  - `httpErrors` com `ExecuteURL` pra `/404.html`: no IIS devolve **status
    200** (soft-404, ruim pra SEO). Deixar o 404 padrão.
  - Redirect HTTP→HTTPS por `{HTTPS}`: se o TLS terminar fora do IIS vira
    **loop**. Só ligar depois de testar com `curl -sIL --max-redirs 5`; se
    quebrar, publicar um `web.config` sem a regra (o mirror não apaga o
    arquivo antigo do servidor, tem que sobrescrever).

## 4. API .NET no IIS — o que importa

- **Framework-dependent, Any CPU** (`dotnet publish -c Release -o publish`).
  Foi o que funcionou no host; `self-contained win-x86` nunca foi confirmado
  subindo. Se o `garlic.backend` ainda tiver `--self-contained -r win-x86`,
  ele está desatualizado em relação ao Green Hunter — avisar o usuário.
- O `web.config` **nasce do `dotnet publish`** (não existe no código-fonte).
  O CI só liga o log: `sed -i 's/stdoutLogEnabled="false"/…="true"/'`. Sem
  shell no host, o log em `logs/stdout_*.log` (via FTP) é o único jeito de
  ver um 500.30.
- **appsettings: o IIS roda em Production**, que carrega
  `appsettings.Production.json` **por cima** do `appsettings.json`. Um arquivo
  antigo (de publicação manual) já no servidor sobrescreve as credenciais
  novas — foi a causa de horas de `smtp_auth`. Por isso o CI grava o **mesmo
  JSON em `appsettings.json` e em `appsettings.Production.json`** e remove o
  `Development`. Se ainda assim parecer config velha: abrir o servidor no
  FileZilla, olhar data/tamanho do `appsettings.Production.json`, apagar.
- Gerar o JSON com `jq -n --arg … --argjson …` (escapa aspas, barra e `$` da
  senha corretamente; `cat <<EOF` com `$VAR` quebra com caractere especial).
- `app_offline.htm`: sobe **antes** (derruba o processo e libera o lock da
  `.dll`), e é removido no **`after_script`** — roda mesmo se o upload falhar,
  senão a API fica offline.
- Reiniciar: o .NET guarda `IOptions<T>` em memória; mudar variável **não**
  muda a API no ar — só um novo deploy (o ciclo de `app_offline.htm` reinicia).
- **Arquivo de exemplo versionado** (`appsettings.Development.example.json`)
  lista **todas** as variáveis exigidas, com a variável do GitLab ao lado de
  cada campo. Regra: configuração nova entra **no exemplo e no CI**.
- `.gitignore`: `appsettings.Development.json`, `appsettings.Production.json`,
  `appsettings.Local.json`, `bin/`, `obj/`, `publish/`, `*.user`,
  `Properties/PublishProfiles/` (Web Deploy guarda credencial).
- Diagnóstico sem log: na resposta de erro do e-mail, devolver só uma
  **categoria** (`smtp_auth`, `smtp_tls`, `smtp_connect`, `smtp_command_5xx`),
  nunca a mensagem da exceção. Detalhe completo fica só no log do servidor.

## 5. Verificar no ar (não confiar só no "job verde")

Rodar `wait-deploy.sh <url-da-api>` depois do push: a janela de **503** (30–60
s, é o `app_offline.htm`) seguida de volta ao normal prova que o deploy rodou.
Depois checar **impressões digitais** da versão nova, só com chamadas inválidas
(nada de POST real sem autorização — pode mandar e-mail de verdade):

- rota removida passou a dar 404; header de CORS mudou;
- validação: POST vazio → 400; payload gigante → 413; origem estranha sem
  `Access-Control-Allow-Origin`;
- limite de requisições: 429 depois do N-ésimo (gasta o limite; deixar folga
  pro teste real).

Pro e-mail/SMTP, só um envio real prova: pedir autorização, destinatário e
remetente de teste. Resposta `smtp_auth` = login recusado (usuário ou senha da
caixa); `smtp_connect` = rede; `smtp_tls` = certificado.

## 6. Armadilhas (cada uma já custou tempo)

1. `550 Access is denied` no mirror → `FTP_PATH` errado ou usuário sem escrita.
2. Senha "certa" recusada → *Expand variable reference* ligado, ou espaço/quebra
   de linha colado na variável, ou a **caixa foi criada com nome errado** (ex.:
   `noreply@api.dominio` em vez de `noreply@dominio`). Testar o login no
   webmail antes de culpar o código.
3. Config velha vencendo a nova → ver seção 4 (Production por cima).
4. Trocar variável não surte efeito → falta redeploy.
5. Log do job inacessível: o GitLab web barra navegador automatizado
   (verificação do Cloudflare) e **não se contorna**. Pedir ao dev que cole as
   últimas linhas do job.
6. `bin/` e `obj/` guardam **cópias** dos `appsettings` com senha. Ao apagar os
   arquivos locais de segredo, apagar essas cópias também.
7. Teste local no Visual Studio: usar o perfil `http` (não `https`/IIS
   Express); redirecionamento HTTPS quebra o preflight de CORS do front.
8. Hospedagem sem painel de encaminhamento de e-mail no webmail: se precisar
   copiar o aviso pra outras pessoas, fazer **na aplicação** (lista de
   destinatários, um envio por endereço — falha de um não derruba os outros).

## 7. Ao terminar, reportar

- Arquivos criados/alterados e variáveis que o usuário ainda precisa cadastrar
  (nome, flags, de onde copiar o valor — **nunca** repetir valor de segredo).
- O resultado real de `wait-deploy.sh` e das checagens (ou o que não deu pra
  verificar e por quê).
- Pendências que dependem do usuário (apagar arquivo antigo no FTP, rotacionar
  senha exposta, cadastrar variável).
