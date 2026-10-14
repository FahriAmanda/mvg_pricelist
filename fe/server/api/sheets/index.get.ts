import { SHEET_CATEGORIES, getStoreState, fetchAllSheets } from '../../utils/sheets'
import type { SheetCategory } from '../../../types/pricelist'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeItems = query.include_items === 'true' || query.all === 'true'

  const store = getStoreState()
  if (!store.lastSync) {
    await fetchAllSheets(true)
  }

  const categories: SheetCategory[] = SHEET_CATEGORIES.map((cat) => {
    const items = store.itemsByCategory[cat.id] || []
    return {
      id: cat.id,
      name: cat.name,
      catalog: cat.catalog,
      gid: cat.gid,
      customUrl: cat.customUrl,
      icon: cat.icon,
      description: cat.description,
      itemCount: items.length,
      lastUpdated: store.lastSync
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
