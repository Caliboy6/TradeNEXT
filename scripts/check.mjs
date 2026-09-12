import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
for (const file of readdirSync(new URL('../', import.meta.url)).filter(file => /\.(js|mjs)$/.test(file))) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
console.log('All application JavaScript modules passed syntax checks.');
