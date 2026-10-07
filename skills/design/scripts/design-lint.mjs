#!/usr/bin/env node
// garlic design-lint — checagens MECÂNICAS de UI para projetos Garlic (React + Tailwind v4 + @banana/ui).
// Sem dependências. Não substitui o julgamento (ver SKILL.md): pega só o que dá pra achar com regex.
//
// Uso: node design-lint.mjs [pasta-ou-arquivo ...]   (default: apps/*/src a partir do cwd)
// Saída: <arquivo>:<linha> [regra] mensagem   |   exit 1 se houver achado, 0 se limpo.
// Suprimir uma linha: comentário "design-lint-ignore" na própria linha ou na anterior.

import fs from 'node:fs';
import path from 'node:path';

const EXT = new Set(['.tsx', '.jsx', '.ts', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'storybook-static', 'coverage']);

// [id, extensões, regex, mensagem]
const RULES = [
  ['cor-literal', ['.tsx', '.jsx', '.ts'], /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/, 'Cor literal no componente. Usar token (brand/secondary/surface/--color-<produto>-*).'],
  ['cor-arbitraria', ['.tsx', '.jsx'], /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-\[(?:#|rgb|hsl)/, 'Cor arbitrária do Tailwind. Usar token do tema.'],
  ['paleta-padrao', ['.tsx', '.jsx'], /\b(?:bg|text|border|from|to|via|ring)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/, 'Paleta padrão do Tailwind (cara de template). Usar brand/secondary/surface; erro/sucesso/aviso também devem ser token semântico, não red-500/green-500.'],
  ['gradiente-texto', ['.tsx', '.jsx'], /\bbg-clip-text\b/, 'Texto com gradiente: marca clássica de UI gerada por IA. Preferir cor sólida do token.'],
  ['blob-decorativo', ['.tsx', '.jsx'], /\bblur-(?:2xl|3xl)\b|\bbackdrop-blur-(?:xl|2xl|3xl)\b/, 'Blur grande decorativo (blob/vidro). Só se tiver função clara.'],
  ['borda-forte', ['.tsx', '.jsx'], /\bborder-(?:2|4|8)\b|\bborder-border-strong\b|\bborder-strong\b/, 'Borda forte. Regra da casa: preferir elevation-N; borda só sutil (border-border-subtle).'],
  ['transition-all', ['.tsx', '.jsx'], /\btransition-all\b/, 'transition-all anima tudo. Listar a propriedade (transition-colors, transition-shadow…).'],
  ['html-cru', ['.tsx', '.jsx'], /<(?:button|input|select|textarea)\b/, 'HTML cru de controle. Usar o componente do @banana/ui (ou criar lá primeiro).'],
  ['img-sem-alt', ['.tsx', '.jsx'], /<img\b(?![^>]*\balt=)/, '<img> sem alt.'],
  ['emoji-na-ui', ['.tsx', '.jsx'], /\p{Extended_Pictographic}/u, 'Emoji na UI como ícone/decoração. Usar o conjunto de ícones do design system.'],
  ['string-hardcoded', ['.tsx', '.jsx'], />\s*[A-Za-zÀ-ÿ][^<>{}=;]{2,}</, 'Possível texto de UI hardcoded. Deve vir de translations/*.json via i18n.'],
  ['style-inline-cor', ['.tsx', '.jsx'], /style=\{\{[^}]*(?:color|background|border)/, 'Cor via style inline. Usar classe com token.'],
  ['px-fonte', ['.css'], /font-size:\s*\d+px/, 'font-size em px fixo no CSS. Usar a escala tipográfica (rem/text-*).'],
  ['css-cor-literal', ['.css'], /(?<!--[\w-]*:\s*[^;]*)(?:^|[^\w-])(?:color|background(?:-color)?|border-color)\s*:\s*#[0-9a-fA-F]{3,8}/, 'Cor literal em CSS fora de definição de token.'],
];

function walk(p, out) {
  let st;
  try { st = fs.statSync(p); } catch { return; }
  if (st.isFile()) { if (EXT.has(path.extname(p))) out.push(p); return; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    walk(path.join(p, e.name), out);
  }
}

let targets = process.argv.slice(2);
if (targets.length === 0) {
  const appsDir = 'apps';
  targets = fs.existsSync(appsDir)
    ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(appsDir, d.name, 'src'))
    : ['src'];
}

const files = [];
for (const t of targets) walk(t, files);

const counts = {};
let total = 0;
for (const file of files) {
  const ext = path.extname(file);
  // Arquivos de tema definem os tokens: cor literal é o trabalho deles.
  const isTheme = /(?:theme|globals|tokens)[^/\\]*\.css$/i.test(file);
  const isStoryOrTest = /\.(?:stories|test|spec)\.[jt]sx?$/.test(file);
  if (isStoryOrTest) continue;
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('design-lint-ignore') || (i > 0 && lines[i - 1].includes('design-lint-ignore'))) return;
    if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return; // comentário
    for (const [id, exts, re, msg] of RULES) {
      if (!exts.includes(ext)) continue;
      if (isTheme && (id === 'css-cor-literal' || id === 'px-fonte')) continue;
      if (id === 'string-hardcoded' && /\bclassName=|\bt\(|\bimport\b|=>/.test(line) && !/>\s*[A-Za-zÀ-ÿ][^<>{}=;]{2,}</.test(line.replace(/className="[^"]*"/g, ''))) continue;
      if (re.test(line)) {
        console.log(`${file}:${i + 1} [${id}] ${msg}`);
        counts[id] = (counts[id] || 0) + 1;
        total++;
      }
    }
  });
}

console.log('');
if (total === 0) {
  console.log(`design-lint: limpo (${files.length} arquivos).`);
  process.exit(0);
}
console.log(`design-lint: ${total} achado(s) em ${files.length} arquivos.`);
for (const [id, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${id}`);
process.exit(1);
