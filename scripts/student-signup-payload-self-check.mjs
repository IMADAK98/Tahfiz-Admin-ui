/** ponytail: real signup/manual-create builders must omit a blank identity key.
 *  strip-types cannot load enums, so this transpiles with the installed typescript. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'signup-payload-'));
const emitted = new Map();

function emit(absPath) {
  if (emitted.has(absPath)) {
    return emitted.get(absPath);
  }
  const outPath = join(outDir, `${emitted.size}.mjs`);
  emitted.set(absPath, outPath);
  let outputText = ts.transpileModule(readFileSync(absPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: absPath,
  }).outputText;
  outputText = outputText.replace(/from ['"](\.[^'"]+)['"]/g, (_, spec) => {
    const target = resolve(dirname(absPath), spec);
    const tsPath = target.endsWith('.ts') ? target : `${target}.ts`;
    return `from '${pathToFileURL(emit(tsPath)).href}'`;
  });
  writeFileSync(outPath, outputText);
  return outPath;
}

const signupUrl = pathToFileURL(
  emit(join(root, 'src/app/features/student-signup/dto/student-signup-form.dto.ts')),
).href;
const manualUrl = pathToFileURL(
  emit(join(root, 'src/app/features/students/dto/student-form.model.ts')),
).href;

const { buildPendingStudentPayload } = await import(signupUrl);
const { buildCreateManualStudentPayload } = await import(manualUrl);

const signupBase = {
  name: ' Test ',
  email: ' a@b.com ',
  phone: ' 050 ',
  birthDate: '2013-01-01',
  address: ' Addr ',
  educationStage: 'ELEMENTARY SCHOOL',
  usePassport: false,
  identificationNumber: ' 1234567890 ',
  passportNumber: '  AB1 ',
  parentPhone: ' 051 ',
  parentName: 'Parent',
  memorization: 'partial',
  surahFrom: 1,
  surahTo: 2,
  hifzQuality: 'NON_HAFIZ',
  memDetail: '',
  token: ' tok ',
};

const nationalId = buildPendingStudentPayload(signupBase);
assert.equal(nationalId.identificationNumber, '1234567890');
assert.equal('passportNumber' in nationalId, false);

const passport = buildPendingStudentPayload({ ...signupBase, usePassport: true });
assert.equal(passport.passportNumber, 'AB1');
assert.equal('identificationNumber' in passport, false);

const blankUsed = buildPendingStudentPayload({ ...signupBase, identificationNumber: '   ' });
assert.equal('identificationNumber' in blankUsed, false);
assert.equal('passportNumber' in blankUsed, false);

const manual = buildCreateManualStudentPayload({
  fullName: 'Test',
  email: 'a@b.com',
  phone: '050',
  educationStage: 'ELEMENTARY SCHOOL',
  identificationNumber: ' 123 ',
  passportNumber: '   ',
  address: 'Addr',
  birthDate: '2013-01-01',
  parentPhone: '051',
  surahFrom: 1,
  surahTo: 2,
  hifzQuality: 'NON_HAFIZ',
  isHafiz: 'false',
});
assert.equal(manual.identificationNumber, '123');
assert.equal('passportNumber' in manual, false);

console.log('student-signup-payload-self-check: ok');
