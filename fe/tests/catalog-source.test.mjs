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

test('Instalasi LED extracts modular and cabinet prices correctly', () => {
  const csv = Papa.unparse([
    ['MODEL (R-X)','TIPE','HARGA MODULAR','HARGA CABINET'],
    ['Qiangli Indoor','Qiangli P2.5 Pro 1/32s','Rp11,200,000','Rp14,700,000'],
  ]);
  const [item] = context.parse('mvg_instalasi_led', csv);
  assert.equal(item.price, 14700000);
  assert.equal(item.metadata.hargaModular, 11200000);
  assert.equal(item.metadata.hargaModularFormatted, 'Rp 11.200.000');
  assert.equal(item.metadata.hargaCabinet, 14700000);
  assert.equal(item.metadata.hargaCabinetFormatted, 'Rp 14.700.000');
  assert.match(item.metadata.specification, /Modular: Rp 11\.200\.000 • Cabinet: Rp 14\.700\.000/);
});

test('Lampro module parses multi-column sheet format with SKU ERP and HPP', () => {
  const row = new Array(42).fill('');
  row[0] = '1';
  row[1] = 'Lampro Module';
  row[2] = 'Indoor';
  row[3] = 'Lampro P4 Pro';
  row[4] = '16x32cm';
  row[14] = 'Rp217,011';
  row[16] = 'Rp246,000';
  row[17] = 'MOD-260927-LPP4PRO-01';
  row[19] = '7680';
  row[41] = 'LAM-IN-P4-PRO';

  const csv = Papa.unparse([
    ['No', 'MODEL', 'TIPE', 'TYPE', 'SIZE'],
    row
  ]);
  const [item] = context.parse('lampro', csv);
  assert.equal(item.price, 246000);
  assert.equal(item.sku, 'LAM-IN-P4-PRO');
  assert.equal(item.metadata.skuErp, 'MOD-260927-LPP4PRO-01');
  assert.equal(item.metadata.hpp, 217011);
  assert.equal(item.model, 'Lampro P4 Pro Indoor');
});
