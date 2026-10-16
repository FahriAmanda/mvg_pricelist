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

  // Always ensure we have data. If fresh requested or no data yet, force fetch.
  const isStale = !store.lastSync || (Date.now() - new Date(store.lastSync).getTime() > 60 * 1000)
  if (!store.lastSync || query.fresh === 'true' || query.force === 'true') {
    await fetchAllSheets(true)
  } else if (isStale && !store.isFetching) {
    fetchAllSheets(false).catch(console.error)
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
