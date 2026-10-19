import { getCategoryItems, getStoreState, fetchAllSheets, refreshErpStockMap, getErpWarehouses } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID required' })
  }

  const query = getQuery(event)
  const store = getStoreState()

  await fetchAllSheets()

  // Follow ERP live stock via fast 10s TTL memory cache
  await refreshErpStockMap()
  const warehouses = getErpWarehouses()

  if (id === 'all') {
    return {
      itemsByCategory: store.itemsByCategory,
      warehouses,
      lastSync: store.lastSync,
      hash: store.contentHash
    }
  }

  const items = getCategoryItems(id)
  const extra = store.categoryExtra?.[id] || {}
  return {
    category: id,
    items,
    warehouses,
    count: items.length,
    lastSync: store.lastSync,
    hash: store.contentHash,
    version: store.version,
    governance: store.governance,
    bannerTitle: extra.bannerTitle,
    bannerSubtitle: extra.bannerSubtitle,
    bannerImage: extra.bannerImage,
    kursUSD: extra.kursUSD,
    notes: extra.notes,
    comparisonChart: extra.comparisonChart
  }
})
