import test from 'node:test'
import assert from 'node:assert/strict'

test('synced items contract validates complete Head-to-Head pairing', async () => {
  const base = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'
  const res = await fetch(`${base}/api/marketing/pricelist-synced-items`)
  assert.equal(res.status, 200, 'HTTP status must be 200')

  const json = await res.json()
  assert.equal(json.status, 'success', 'Response status must be success')
  assert.ok(Array.isArray(json.data), 'data must be an array')
  assert.ok(json.data.length > 0, 'data must contain synced items')
  assert.ok(Array.isArray(json.warehouses), 'warehouses must be an array')
  assert.ok(json.warehouses.length > 0, 'warehouses must not be empty')

  for (const item of json.data) {
    // Pricelist side
    assert.ok(item.pricelist, 'Item must have pricelist payload')
    assert.ok(typeof item.pricelist.sku === 'string', 'Pricelist must have sku')
    assert.ok(typeof item.pricelist.price === 'number', 'Pricelist must have price')

    // ERP side
    assert.ok(item.erp, 'Item must have erp payload')
    assert.ok(typeof item.erp.kode_item === 'string', 'ERP must have kode_item')
    assert.ok(typeof item.erp.nama_item === 'string', 'ERP must have nama_item')
    assert.ok(typeof item.erp.available_stock === 'number', 'ERP must have available_stock')
    assert.ok(Array.isArray(item.erp.batches), 'ERP must have batches array')

    // Audit side
    assert.ok(item.audit, 'Item must have audit payload')
    assert.ok(typeof item.audit.is_sku_match === 'boolean', 'Audit must have is_sku_match')
    assert.ok(typeof item.audit.is_price_match === 'boolean', 'Audit must have is_price_match')
    assert.ok(typeof item.audit.price_diff === 'number', 'Audit must have price_diff')
  }
})
