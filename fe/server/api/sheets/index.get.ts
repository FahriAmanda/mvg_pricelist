import { SHEET_CATEGORIES, getStoreState, fetchAllSheets, refreshErpStockMap } from '../../utils/sheets'
import type { SheetCategory } from '../../../types/pricelist'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  const query = getQuery(event)
  const includeItems = query.include_items === 'true' || query.all === 'true'

  const store = getStoreState()
  await fetchAllSheets()
  if (includeItems) await refreshErpStockMap()

  const categories: SheetCategory[] = SHEET_CATEGORIES.map((cat) => {
    const items = store.itemsByCategory[cat.id] || []
    const extra = store.categoryExtra?.[cat.id] || {}
    return {
      id: cat.id,
      name: cat.name,
      catalog: cat.catalog,
      icon: cat.icon,
      description: cat.description,
      itemCount: items.length,
      lastUpdated: store.lastSync,
      bannerTitle: extra.bannerTitle,
      bannerSubtitle: extra.bannerSubtitle,
      bannerImage: extra.bannerImage,
      kursUSD: extra.kursUSD,
      notes: extra.notes,
      comparisonChart: extra.comparisonChart
    }
  })

  const totalItems = Object.values(store.itemsByCategory).reduce(
    (acc, list) => acc + list.length,
    0
  )

  const response: Record<string, any> = {
    categories,
    lastSync: store.lastSync,
    hash: store.contentHash,
    version: store.version,
    governance: store.governance,
    totalItems
  }

  if (includeItems) {
    response.itemsByCategory = store.itemsByCategory
    // Also provide flat allItems array
    const allItems: any[] = []
    for (const catId of Object.keys(store.itemsByCategory)) {
      allItems.push(...store.itemsByCategory[catId])
    }
    response.allItems = allItems
  }

  return response
})
