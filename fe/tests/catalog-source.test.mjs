import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import Papa from 'papaparse';

// Execute the real parser only, without importing the legacy module's writers.
const sourcePath = fs.existsSync('server/utils/catalogSource.ts') ? 'server/utils/catalogSource.ts' : 'server/utils/sheets.ts';
const source = fs.readFileSync(sourcePath, 'utf8');
const ast = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
const names = new Set(['parsePrice', 'formatRupiah', 'slugify', 'normalizeProductName', 'SHEET_CATEGORIES', 'DEFAULT_CATEGORY_EXTRA', 'MOKA_IMAGES', 'HOIST_LINKS', 'GAGA_LINKS', 'MEANREAL_LINKS', 'parseSheetRows']);
const statements = ast.statements.filter(st => names.has(st.name?.text || (ts.isVariableStatement(st) ? st.declarationList.declarations[0].name.text : ''))).map(st => st.getText(ast));
const context = { Papa, console, store: { categoryExtra: {} } };
vm.createContext(context);
vm.runInContext(ts.transpileModule(statements.join('\n').replace(/export /g, '') + '\nglobalThis.parse = parseSheetRows', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);

test('Cabinet uses named price and SKU columns, never numbers in description', () => {
  const csv = Papa.unparse([
    ['MODEL','TIPE','UKURAN','DESKRIPSI','HARGA','SKU'],
    ['Cabinet Iron','Outdoor','96x96cm','Fans: 2 pcs; PSU: 3 pcs; RC: 1 pc','Rp1,136,000','CAB-IR-OUT-96X96'],
  ]);
  const [item] = context.parse('cabinet', csv);
  assert.equal(item.price, 1136000);
  assert.equal(item.sku, 'CAB-IR-OUT-96X96');
  assert.match(item.model, /96x96cm/);
});
