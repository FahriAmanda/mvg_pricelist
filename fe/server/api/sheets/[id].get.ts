import { getCategoryItems, getStoreState, fetchAllSheets } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID required' })
  }

  const store = getStoreState()
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
