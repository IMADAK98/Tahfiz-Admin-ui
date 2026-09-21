/** ponytail: fail if template-driven FormsModule/ngModel leak back in. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(ts|html)$/.test(name)) {
      continue;
    }
    const text = readFileSync(path, 'utf8');
    if (/\bFormsModule\b/.test(text) || /\bngModel\b/.test(text)) {
      hits.push(path);
    }
  }
}

walk(root);
if (hits.length) {
  throw new Error(`template-driven leftovers:\n${hits.join('\n')}`);
}

console.log('reactive-forms-self-check: ok');
