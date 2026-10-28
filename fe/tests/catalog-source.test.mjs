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

test('Instalasi LED master emits two literal ERP variants for one package row', () => {
  const row = new Array(64).fill('');
  row[0] = '1';
  row[1] = 'QiangLi Module';
  row[2] = 'Indoor';
  row[3] = 'Qiangli P4 Pro';
  row[4] = '16x32cm';
  row[55] = 'Rp8,200,000';
  row[56] = 'Rp6,900,000';
  row[57] = 'PKT-260929-PAKEQIA-23';
  row[58] = 'Rp11,300,000';
  row[59] = 'Rp9,000,000';
  row[60] = 'FNC-260929-PAKEQIA-17';

  const parsed = context.parse('mvg_instalasi_led', Papa.unparse([['No', 'TYPE'], row]));
  assert.equal(parsed.length, 2);
  assert.equal(JSON.stringify(parsed.map(item => ({
    id: item.id,
    sku: item.sku,
    erp: item.metadata.skuErp,
    variant: item.metadata.variant,
    price: item.price,
    modular: item.metadata.hargaModular,
    cabinet: item.metadata.hargaCabinet,
  }))), JSON.stringify([
    { id: 'mvg_instalasi_led-1-modular', sku: 'PKT-260929-PAKEQIA-23', erp: 'PKT-260929-PAKEQIA-23', variant: 'MODULAR', price: 8200000, modular: 8200000, cabinet: null },
    { id: 'mvg_instalasi_led-1-cabinet', sku: 'FNC-260929-PAKEQIA-17', erp: 'FNC-260929-PAKEQIA-17', variant: 'CABINET', price: 11300000, modular: null, cabinet: 11300000 },
  ]));
  assert.match(parsed[0].model, /Modular$/);
  assert.match(parsed[1].model, /Cabinet$/);
  assert.match(parsed[0].description, /Paket Instalasi LED Videotron/);
  assert.equal(parsed[0].image, '/images/products/instalasi-led/modular-installation.png');
  assert.equal(parsed[1].image, '/images/products/instalasi-led/cabinet-indoor-installation.png');
  assert.equal(JSON.stringify(parsed[0].images), JSON.stringify(['/images/products/instalasi-led/modular-installation.png']));
  assert.equal(JSON.stringify(parsed[1].images), JSON.stringify(['/images/products/instalasi-led/cabinet-indoor-installation.png']));
});

test('Instalasi LED reads current Sheet exports with blank BF/BJ image cells', () => {
  const row = new Array(66).fill('');
  row[0] = '20';
  row[2] = 'Outdoor';
  row[3] = 'Qiangli P8 Pro';
  row[55] = 'Rp8,200,000';
  row[57] = ''; // BF: embedded Modular image cell retained by CSV export
  row[58] = 'PKT-OUTDOOR-01'; // BG: literal ERP SKU
  row[59] = 'Rp11,300,000';
  row[61] = ''; // BJ: embedded Cabinet image cell retained by CSV export
  row[62] = 'FNC-OUTDOOR-01'; // BK: literal ERP SKU

  const parsed = context.parse('mvg_instalasi_led', Papa.unparse([['No', 'TYPE'], row]));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].sku, 'PKT-OUTDOOR-01');
  assert.equal(parsed[1].sku, 'FNC-OUTDOOR-01');
  assert.equal(parsed[0].price, 8200000);
  assert.equal(parsed[1].price, 11300000);
  assert.equal(parsed[0].image, '/images/products/instalasi-led/modular-installation.png');
  assert.equal(parsed[1].image, '/images/products/instalasi-led/cabinet-outdoor-installation.png');
});

test('Qiangli master preserves catalog SKU and explicit ERP variant identity', () => {
  const rows = ['25', '26', '30'].map(no => {
    const row = new Array(64).fill('');
    row[0] = no; row[1] = 'Qiangli Module'; row[2] = no === '30' ? 'Indoor' : 'Outdoor';
    row[3] = no === '25' ? 'Qiangli P2.5 Pro' : no === '26' ? 'Qiangli P2 Pro' : 'Qiangli P1.2 Pro COB';
    row[4] = '16x32cm'; row[13] = 'Rp456,679'; row[15] = 'Rp549,000'; row[18] = '7680';
    row[16] = no === '25' ? 'QL-MOD-OUTDOOR-P2-PRO' : no === '26' ? 'MOD-260927-QLP2PRO-02' : '';
    row[63] = no === '25' ? 'QL-MOD-OUTDOOR-P25-PRO' : no === '26' ? 'QL-MOD-OUTDOOR-P2-PRO' : '';
    return row;
  });
  const parsed = context.parse('qiangli', Papa.unparse([['No', 'TYPE'], ...rows]));
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].id, 'qiangli-25');
  assert.equal(parsed[0].metadata.skuErp, 'QL-MOD-OUTDOOR-P2-PRO');
  assert.equal(parsed[1].sku, 'QL-MOD-OUTDOOR-P2-PRO');
  assert.equal(parsed[1].metadata.skuErp, 'MOD-260927-QLP2PRO-02');
  assert.equal(parsed[0].metadata.hpp, 456679);
  assert.equal(parsed[0].price, 549000);
  assert.equal(parsed[0].model, 'Qiangli P2.5 Pro Outdoor');
  assert.equal(parsed[2].id, 'qiangli-30');
  assert.equal(parsed[2].metadata.skuErp, undefined);
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

test('Novastar parses multi-column format and resolves ERP aliases and fallback SKUs', () => {
  const row1 = new Array(18).fill('');
  row1[0] = 'Novastar';
  row1[1] = 'NovaStar H Series 1×HDMI2.0 Output Card';
  row1[2] = 'H Series I/O Card';
  row1[4] = 'NS-OC-1HDMI-2.0-H';
  row1[5] = 'NS-OC-1HDMI-2.0-H';
  row1[13] = 'Rp13,000,000';
  row1[14] = '25%';
  row1[15] = 'Rp16,251,000';

  const row2 = new Array(18).fill('');
  row2[0] = 'Novastar';
  row2[1] = 'Novastar NV7508 Receiving Card';
  row2[2] = 'Receiving Card';
  row2[4] = 'NS-RC-DH7508-8P';
  row2[5] = 'NS-RC-NV7508-8P';
  row2[13] = 'Rp164,398';
  row2[14] = '17%';
  row2[15] = 'Rp193,000';

  const row3 = new Array(18).fill('');
  row3[0] = 'Novastar';
  row3[1] = 'NovaPro UHD Jr Video Controller';
  row3[2] = 'Video Processor';
  row3[4] = 'BELUM ADA DI ERP';
  row3[5] = 'NS-VP-NOVAPRO-UHD-JR';
  row3[13] = 'Rp67,184,440';
  row3[14] = '25%';
  row3[15] = 'Rp83,981,000';

  const parsed = context.parse('novastar', Papa.unparse([['MODEL', 'MODEL', 'DESCRIPTION', '', 'SKU ERP', 'SKU', '', '', '', '', '', '', '', 'Capital/HPP', 'PROFIT', 'SELLING PRICE'], row1, row2, row3]));
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].sku, 'NS-OC-1HDMIOUT-2.0-H');
  assert.equal(parsed[0].metadata?.skuErp, 'NS-OC-1HDMIOUT-2.0-H');
  assert.equal(parsed[0].price, 16251000);

  assert.equal(parsed[1].sku, 'RCV-261009-NOVANV7-01');
  assert.equal(parsed[1].metadata?.skuErp, 'RCV-261009-NOVANV7-01');
  assert.equal(parsed[1].price, 193000);

  assert.equal(parsed[2].sku, 'NS-VP-NOVAPRO-UHD-JR');
  assert.equal(parsed[2].metadata?.skuErp, 'NS-VP-NOVAPRO-UHD-JR');
  assert.equal(parsed[2].price, 83981000);
});
