/** ponytail: fail if template-driven FormsModule/ngModel leak back in,
 *  or a <form> binds (ngSubmit) without [formGroup] (NgForm never attaches). */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(repoRoot, 'src');

/** Opening tag only. A (ngSubmit) in the form body is out of scope. */
function formTagsMissingReactiveGroup(html) {
  const missing = [];
  for (const tag of html.match(/<form\b[^>]*>/g) ?? []) {
    if (/\(ngSubmit\)/.test(tag) && !/\[formGroup\]/.test(tag)) {
      missing.push(tag.replace(/\s+/g, ' '));
    }
  }
  return missing;
}

assert.deepEqual(formTagsMissingReactiveGroup('<form (ngSubmit)="save()">'), [
  '<form (ngSubmit)="save()">',
]);
assert.deepEqual(
  formTagsMissingReactiveGroup('<form [formGroup]="form" (ngSubmit)="save()">'),
  [],
);
assert.deepEqual(
  formTagsMissingReactiveGroup('<form\n  [formGroup]="form"\n  (ngSubmit)="onSubmit()"\n>'),
  [],
);
assert.deepEqual(formTagsMissingReactiveGroup('<form (submit)="onSubmit($event)" novalidate>'), []);

const hits = [];
const ngSubmitHits = [];

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
    if (name.endsWith('.html')) {
      const missing = formTagsMissingReactiveGroup(text);
      if (missing.length) {
        ngSubmitHits.push(`${relative(repoRoot, path)}: ${missing.join(' | ')}`);
      }
    }
  }
}

walk(root);
if (hits.length) {
  throw new Error(`template-driven leftovers:\n${hits.join('\n')}`);
}
if (ngSubmitHits.length) {
  throw new Error(`(ngSubmit) without [formGroup]:\n${ngSubmitHits.join('\n')}`);
}

console.log('reactive-forms-self-check: ok');
