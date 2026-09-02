#!/usr/bin/env node
// garlic plugin — SessionStart detection hook
//
// Roda em toda sessão nova. Se o cwd estiver dentro de um workspace no
// formato Garlic (repos irmãos <produto>.frontend/.infra/.automations/
// .backend/.docs), emite pro contexto onde fica o cérebro global (.docs)
// e o cérebro local (project/ ou docs/ do repo atual) — sem isso, sessão
// nova não tem sinal nenhum de que está num multi-root e perde tempo
// inferindo (ver garlic.docs/task-master.md, pendência registrada em
// 2026-08-25 a partir de um teste real com o clone foodpdv).
//
// Silencioso (sem stdout) se não detectar o padrão — não deve poluir
// sessão em repo qualquer que não seja Garlic.

const fs = require('fs');
const path = require('path');

const ROLES = ['frontend', 'infra', 'automations', 'backend', 'docs'];
const ROLE_RE = new RegExp(`^(.+)\\.(${ROLES.join('|')})$`);

function findRepoRoot(startDir) {
  let cur = startDir;
  while (true) {
    if (fs.existsSync(path.join(cur, '.git'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

const cwd = process.cwd();
const repoRoot = findRepoRoot(cwd);
if (!repoRoot) process.exit(0);

const repoName = path.basename(repoRoot);
const curMatch = repoName.match(ROLE_RE);
if (!curMatch) process.exit(0); // repo não segue a convenção <produto>.<role>

const [, produto, curRole] = curMatch;
const reposParent = path.dirname(repoRoot);
const siblings = safeReadDir(reposParent).filter((d) => d.isDirectory());

const found = {};
for (const d of siblings) {
  const m = d.name.match(ROLE_RE);
  if (m && m[1] === produto) found[m[2]] = path.join(reposParent, d.name);
}

// Exige pelo menos 2 papéis do MESMO produto (o atual + 1 irmão) — evita
// falso positivo em pasta solta que só por coincidência termina em ".docs".
const rolesFound = Object.keys(found);
if (rolesFound.length < 2) process.exit(0);

const docsPath = found.docs;
const localBrainDir = ['project', 'docs']
  .map((d) => path.join(repoRoot, d))
  .find((p) => fs.existsSync(p));

const lines = [];
lines.push(`WORKSPACE GARLIC DETECTADO — produto "${produto}".`);
lines.push(`Repo atual: ${repoName} (papel: ${curRole}).`);
lines.push(`Repos irmãos encontrados: ${rolesFound.map((r) => `${produto}.${r}`).join(', ')}.`);

if (docsPath && curRole !== 'docs') {
  lines.push(
    `Cérebro GLOBAL (decisão de produto, cross-repo): ${docsPath} — ler CLAUDE.md/README.md de lá antes de qualquer tarefa que não seja puramente técnica deste repo, se ainda não leu nesta sessão.`,
  );
}
if (localBrainDir) {
  lines.push(
    `Cérebro LOCAL deste repo (regra técnica/arquitetura específica): ${localBrainDir} — ler CLAUDE.md/lessons/task-master de lá antes de codar.`,
  );
}
lines.push(
  'Se a tarefa pedida cruzar mais de um repo do produto ou for decisão de produto/negócio, considerar abrir o cérebro global primeiro.',
);

process.stdout.write(lines.join('\n'));
