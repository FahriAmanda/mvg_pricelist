import { defineEventHandler, getRouterParam, createError } from 'h3'
import { SHEET_CATEGORIES, getStoreState, fetchAllSheets } from '../../../utils/sheets'
import type { PricelistItem, SheetCategory } from '../../../../types/pricelist'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Item ID or SKU is required' })
    }

    const store = getStoreState()
  await fetchAllSheets()

    let matchedItem: PricelistItem | null = null
    let matchedCategory: SheetCategory | null = null

    // Search across all categories
    for (const cat of SHEET_CATEGORIES) {
      const items = store.itemsByCategory[cat.id] || []
      const found = items.find((it) => it.id === id || it.sku === id || it.id?.toLowerCase() === id.toLowerCase() || it.sku?.toLowerCase() === id.toLowerCase())
      if (found) {
        matchedItem = found
        matchedCategory = cat
        break
      }
    }

    if (!matchedItem || !matchedCategory) {
      throw createError({ statusCode: 404, statusMessage: `Item dengan ID/SKU "${id}" tidak ditemukan` })
    }

    const categoryItems = store.itemsByCategory[matchedCategory.id] || []
    const relatedItems = categoryItems
      .filter((it) => it.id !== matchedItem?.id && it.sku !== matchedItem?.sku)
      .slice(0, 4)

    const extra = store.categoryExtra?.[matchedCategory.id] || {}

    return {
      item: matchedItem,
      category: matchedCategory,
      categoryExtra: {
        bannerTitle: extra.bannerTitle,
        bannerSubtitle: extra.bannerSubtitle,
        bannerImage: extra.bannerImage,
        kursUSD: extra.kursUSD,
        notes: extra.notes,
        comparisonChart: extra.comparisonChart
      },
      relatedItems,
      lastSync: store.lastSync
    }
  } catch (err: any) {
    console.error('[API sheets/item] Error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Server Error'
    })
  }
})
