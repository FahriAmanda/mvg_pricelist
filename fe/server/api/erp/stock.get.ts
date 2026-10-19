import { refreshErpStockMap, getErpWarehouses, getStoreState, applyLiveStockToAllCategories } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  try {
    const stockMap = await refreshErpStockMap(true)
    const warehouses = getErpWarehouses()
    applyLiveStockToAllCategories()

    return {
      status: 'success',
      data: stockMap,
      warehouses,
      synced_at: new Date().toISOString()
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Failed to fetch live ERP stock'
    }
  }
})