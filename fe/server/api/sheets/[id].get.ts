import { getCategoryItems, getStoreState, fetchAllSheets } from '../../utils/sheets'

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

  // Cold start bootstrap only. NEVER poll or re-fetch in the background on visitor requests.
  if (!store.lastSync) {
    await fetchAllSheets(true)
  }

  if (id === 'all') {
    return {
      itemsByCategory: store.itemsByCategory,
      lastSync: store.lastSync,
      hash: store.contentHash
    }
  }

  const items = getCategoryItems(id)
  const extra = store.categoryExtra?.[id] || {}
  return {
    category: id,
    items,
    count: items.length,
    lastSync: store.lastSync,
    hash: store.contentHash,
    bannerTitle: extra.bannerTitle,
    bannerSubtitle: extra.bannerSubtitle,
    bannerImage: extra.bannerImage,
    kursUSD: extra.kursUSD,
    notes: extra.notes,
    comparisonChart: extra.comparisonChart
  }
})
