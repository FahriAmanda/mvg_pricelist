import { SHEET_CATEGORIES, getStoreState, fetchAllSheets } from '../../utils/sheets'
import type { SheetCategory } from '../../../types/pricelist'

export default defineEventHandler(async () => {
  const store = getStoreState()
  if (!store.lastSync) {
    await fetchAllSheets(true)
  }

  const categories: SheetCategory[] = SHEET_CATEGORIES.map((cat) => {
    const items = store.itemsByCategory[cat.id] || []
    return {
      id: cat.id,
      name: cat.name,
      gid: cat.gid,
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

  return {
    categories,
    lastSync: store.lastSync,
    hash: store.contentHash,
    totalItems
  }
})
