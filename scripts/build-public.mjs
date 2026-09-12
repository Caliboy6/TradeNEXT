import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { renderLanding } = await import(pathToFileURL(resolve(root, 'opennext-public-pages.js')));
const indexPath = resolve(root, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const entry = html.match(/<script type="module" src="([^"]+)"/)[1];
const modules = new Set();
function visit(url) {
  if (modules.has(url)) return;
  modules.add(url);
  const source = readFileSync(resolve(root, url.split('?')[0]), 'utf8');
  const dependencies = /\b(?:from\s*|import\s*(?:\(\s*)?)(["'])(\.\/[^"']+\.js(?:\?[^"']*)?)\1/g;
  for (const match of source.matchAll(dependencies)) visit(match[2]);
}
visit(entry);
html = html.replace(/<!-- opennext:preload:start -->[\s\S]*?<!-- opennext:preload:end -->/, `<!-- opennext:preload:start -->\n${[...modules].map(url => `    <link rel="modulepreload" href="${url}">`).join('\n')}\n    <!-- opennext:preload:end -->`);
html = html.replace(/<!-- opennext:landing:start -->[\s\S]*?<!-- opennext:landing:end -->/, `<!-- opennext:landing:start -->${renderLanding('en')}<!-- opennext:landing:end -->`);
writeFileSync(indexPath, html);
console.log(`Prerendered the full public homepage; preloaded ${modules.size} application modules.`);
