import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('stock refresh uses ERP alias and cannot change price or sale eligibility',async()=>{
 const snapshot={version:'test-v1',hash:'test-hash',lastSync:'2026-10-20T22:00:00Z',categories:[{id:'cat'}],itemsByCategory:{cat:[{sku:'VENDOR',erpSku:'ERP',price:99,sellable:false}]}};
 const source=fs.readFileSync('server/utils/sheets.ts','utf8').replace(/^import .*$/gm,'').replace(/^export \{.*$/gm,'').replace(/export /g,'');
 const ctx={SHEET_CATEGORIES:[{id:'cat'}],process:{env:{}},AbortSignal,createError:x=>new Error(x.statusMessage),fetch:async url=>({ok:true,json:async()=>url.includes('snapshot')?structuredClone(snapshot):{status:'success',data:{ERP:{available_stock:9,batches:[]}},warehouses:[]}})};
 vm.createContext(ctx);vm.runInContext(ts.transpileModule(source+'\nglobalThis.api={fetchAllSheets,refreshErpStockMap,getStoreState}',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,ctx);
 await ctx.api.fetchAllSheets();await ctx.api.refreshErpStockMap(true);const row=ctx.api.getStoreState().itemsByCategory.cat[0];
 assert.equal(row.price,99);assert.equal(row.sellable,false);assert.equal(row.availableStock,9);
});
