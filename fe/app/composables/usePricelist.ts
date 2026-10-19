import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { PricelistItem, SheetCategory } from '../types/pricelist'

export interface UsePricelistOptions {
  catalog?: 'mvg' | 'av'
  categoryId?: string
  search?: string
  type?: string
  sort?: 'default' | 'price-asc' | 'price-desc' | 'name'
}

export function usePricelist(initialOptions?: UsePricelistOptions) {
  const categories = ref<SheetCategory[]>([])
  const activeCatalog = ref<'mvg' | 'av'>(initialOptions?.catalog || 'mvg')
  const activeCategoryId = ref<string>(
    initialOptions?.categoryId || (activeCatalog.value === 'av' ? 'qiangli' : 'mvg_rental_qiangli')
  )
  const allItems = ref<Record<string, PricelistItem[]>>({})
  const isLoading = ref<boolean>(false)
  const isSyncing = ref<boolean>(false)
  const isLiveConnected = ref<boolean>(false)
  const lastSyncTime = ref<string>('')
  const searchQuery = ref<string>(initialOptions?.search || '')
  const typeFilter = ref<string>(initialOptions?.type || 'ALL')
  const selectedGudang = ref<string>('ALL')
  const warehouseList = ref<Array<{ id: string; kode_gudang: string; nama_gudang: string }>>([])
  const erpSyncFilter = ref<'ALL' | 'SYNCED' | 'NOT_SYNCED'>(
    (initialOptions?.erpSync as any) || 'ALL'
  )
  const sortBy = ref<'default' | 'price-asc' | 'price-desc' | 'name'>(initialOptions?.sort || 'default')
  const updatedItemIds = ref<Set<string>>(new Set())

  let eventSource: EventSource | null = null
  let pollInterval: any = null

  // Grouped categories by Catalog
  const mvgCategories = computed(() =>
    categories.value.filter((c) => c.catalog === 'mvg')
  )
  const avCategories = computed(() =>
    categories.value.filter((c) => c.catalog === 'av')
  )
  const currentCatalogCategories = computed(() =>
    activeCatalog.value === 'mvg' ? mvgCategories.value : avCategories.value
  )

  async function loadPrivateCosts() {
    const auth=useAuthStore()
    if(!auth.token)return
    try {
      const privileged=await $fetch<{costs:Record<string,Record<string,unknown>>}>('/api/erp/private-costs',{headers:{Authorization:`Bearer ${auth.token}`}})
      for(const items of Object.values(allItems.value)) for(const item of items) item.metadata={...item.metadata,...privileged.costs[`${item.category}:${item.id}`]}
    }catch { /* Only verified Super Admin responses contain costs. */ }
  }
  // Fetch initial categories and data
  async function loadData(force = false) {
    isLoading.value = true
    try {
      const catRes = await $fetch<{
        categories: SheetCategory[]
        lastSync: string
        hash: string
        totalItems: number
      }>('/api/sheets', { query: force ? { fresh: 'true' } : undefined })

      categories.value = catRes.categories
      lastSyncTime.value = catRes.lastSync

      // Ensure active category matches active catalog if not set properly
      if (categories.value.length > 0) {
        if (activeCategoryId.value === 'all') {
          // 'all' is explicitly allowed across all categories, keep it!
        } else {
          const found = categories.value.find((c) => c.id === activeCategoryId.value)
          if (found) {
            activeCatalog.value = found.catalog
          } else {
            const firstInCatalog = categories.value.find(
              (c) => c.catalog === activeCatalog.value
            )
            if (firstInCatalog) {
              activeCategoryId.value = firstInCatalog.id
            }
          }
        }
      }

      const dataRes = await $fetch<{
        itemsByCategory: Record<string, PricelistItem[]>
        warehouses?: Array<{ id: string; kode_gudang: string; nama_gudang: string }>
        lastSync: string
        hash: string
      }>('/api/sheets/all', { query: force ? { fresh: 'true' } : undefined })

      allItems.value = dataRes.itemsByCategory || {}
      await loadPrivateCosts()
      if (Array.isArray(dataRes.warehouses) && dataRes.warehouses.length > 0) {
        warehouseList.value = dataRes.warehouses
      }
      lastSyncTime.value = dataRes.lastSync

      // Follow ERP live stock via fast API
      await refreshLiveStock()
    } catch (err) {
      console.error('Failed to load pricelist data:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch live ERP stock directly via API
  async function refreshLiveStock() {
    try {
      const res = await $fetch<{
        status: string
        data: Record<string, any>
        warehouses: Array<{ id: string; kode_gudang: string; nama_gudang: string }>
      }>('/api/erp/stock')

      if (res?.status === 'success' && res.data) {
        if (Array.isArray(res.warehouses) && res.warehouses.length > 0) {
          warehouseList.value = res.warehouses
        }
        for (const catId of Object.keys(allItems.value)) {
          const list = allItems.value[catId] || []
          for (const item of list) {
            const skuErp = item.metadata?.skuErp
            const skuBiasa = item.metadata?.skuBiasa
            const sInfo = res.data[item.erpSku || item.sku] ||
              (skuErp ? res.data[skuErp] : undefined) ||
              (skuBiasa ? res.data[skuBiasa] : undefined)

            if (sInfo && sInfo.is_synced) {
              // The snapshot controls mapping and sale eligibility.
              // STRICTLY AVAILABLE STOCK ONLY - NEVER FREE / PHYSICAL STOCK
              item.availableStock = Number(sInfo.available_stock || 0)
              item.batches = Array.isArray(sInfo.batches) ? sInfo.batches : []
            }
          }
        }
      }
    } catch (e) {
      // non-blocking
    }
  }

  // Helper to get available stock based on selected warehouse
  function getItemAvailableStock(item: PricelistItem, gudang = selectedGudang.value): number {
    if (!item?.isSynced) return 0
    if (!gudang || gudang === 'ALL') {
      return Number(item.availableStock || 0)
    }
    const batches = Array.isArray(item.batches) ? item.batches : []
    const matched = batches.filter((b: any) =>
      b.nama_gudang === gudang || b.m_gudang_id === gudang || b.kode_gudang === gudang
    )
    return matched.reduce((sum: number, b: any) => sum + Number(b.available_stock || 0), 0)
  }

  // Trigger manual sync
  async function triggerSync() {
    if (isSyncing.value) return
    isSyncing.value = true
    try {
      const res = await $fetch<{
        success: boolean
        message: string
        totalItems: number
        lastSync: string
      }>('/api/sheets/sync', { method: 'POST' })

      lastSyncTime.value = res.lastSync

      // Refresh items
      const dataRes = await $fetch<{
        itemsByCategory: Record<string, PricelistItem[]>
        lastSync: string
      }>('/api/sheets/all')

      allItems.value = dataRes.itemsByCategory || {}
      await loadPrivateCosts()
      return res
    } catch (err) {
      console.error('Sync failed:', err)
      throw err
    } finally {
      isSyncing.value = false
    }
  }

  // Connect SSE for realtime updates
  function connectSSE() {
    if (import.meta.server) return

    try {
      eventSource = new EventSource('/api/sheets/stream')

      eventSource.addEventListener('connected', () => {
        isLiveConnected.value = true
      })

      eventSource.addEventListener('sync', async (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          lastSyncTime.value = payload.lastSync

          // Refresh categories & items concurrently
          const [catRes, dataRes] = await Promise.all([
            $fetch<{ categories: SheetCategory[]; lastSync: string }>('/api/sheets').catch(() => null),
            $fetch<{ itemsByCategory: Record<string, PricelistItem[]> }>('/api/sheets/all')
          ])

          if (catRes?.categories) {
            categories.value = catRes.categories
          }

          const newItems = dataRes.itemsByCategory || {}
          const changed = new Set<string>()

          for (const cat of payload.updatedCategories || []) {
            const list = newItems[cat] || []
            for (const item of list) {
              if (item.previousPrice && item.previousPrice !== item.price) {
                changed.add(item.id)
              }
            }
          }

          allItems.value = newItems
          updatedItemIds.value = changed

          setTimeout(() => {
            updatedItemIds.value.clear()
          }, 5000)
        } catch (err) {
          console.error('Error handling sync event:', err)
        }
      })

      eventSource.onerror = () => {
        isLiveConnected.value = false
        eventSource?.close()
        setTimeout(connectSSE, 5000)
      }
    } catch (err) {
      console.error('SSE initialization error:', err)
      isLiveConnected.value = false
    }
  }

  onMounted(() => {
    loadData()
    connectSSE()

    if (!import.meta.server) {
      let tick=0
      pollInterval = setInterval(() => { void refreshLiveStock(); if(++tick % 3 === 0) void loadData() }, 20000)
      window.addEventListener('focus', refreshLiveStock)
    }
  })

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    if (!import.meta.server) {
      window.removeEventListener('focus', refreshLiveStock)
    }
  })

  // Watch active category and sync activeCatalog
  watch(
    () => activeCategoryId.value,
    (newCatId) => {
      if (newCatId && newCatId !== 'all' && categories.value.length > 0) {
        const found = categories.value.find((c) => c.id === newCatId)
        if (found && found.catalog !== activeCatalog.value) {
          activeCatalog.value = found.catalog
        }
      }
    }
  )

  // Switch Catalog helper
  function setCatalog(catalog: 'mvg' | 'av') {
    activeCatalog.value = catalog
    if (activeCategoryId.value !== 'all') {
      const targetCats = catalog === 'mvg' ? mvgCategories.value : avCategories.value
      if (targetCats.length > 0) {
        const stillInCatalog = targetCats.some((c) => c.id === activeCategoryId.value)
        if (!stillInCatalog) {
          activeCategoryId.value = targetCats[0].id
        }
      }
    }
  }

  // Active Category metadata
  const currentCategory = computed(() => {
    if (activeCategoryId.value === 'all') {
      const isMvg = activeCatalog.value === 'mvg'
      const targetCats = isMvg ? mvgCategories.value : avCategories.value
      const total = targetCats.reduce((acc, c) => acc + c.itemCount, 0)
      return {
        id: 'all',
        name: 'Semua Kategori',
        catalog: activeCatalog.value,
        icon: isMvg ? 'Sparkles' : 'Boxes',
        description: isMvg
          ? `Menampilkan seluruh produk hardware & rental Mitra Visual Group (${targetCats.length} Kategori)`
          : `Menampilkan seluruh produk display & controller Asia Visiotron (${targetCats.length} Kategori)`,
        itemCount: total,
        lastUpdated: lastSyncTime.value || ''
      }
    }

    return (
      categories.value.find((c) => c.id === activeCategoryId.value) ||
      categories.value[0] || {
        id: activeCategoryId.value,
        name: activeCategoryId.value,
        catalog: activeCatalog.value,
        icon: 'Box',
        description: '',
        itemCount: 0,
        lastUpdated: ''
      }
    )
  })

  // Raw items for active category
  const activeItems = computed(() => {
    if (activeCategoryId.value === 'all') {
      const targetCats = activeCatalog.value === 'mvg' ? mvgCategories.value : avCategories.value
      const list: PricelistItem[] = []
      for (const cat of targetCats) {
        list.push(...(allItems.value[cat.id] || []))
      }
      return list
    }
    return allItems.value[activeCategoryId.value] || []
  })

  // Unique types available in current category for filter dropdown
  const availableTypes = computed(() => {
    const set = new Set<string>()
    for (const item of activeItems.value) {
      if (item.type) {
        const simple = item.type.split(/[\(\/-]/)[0].trim()
        if (simple) set.add(simple)
      }
    }
    return Array.from(set)
  })

  // ERP Sync Status Statistics for filter badges & dropdown
  const erpSyncCounts = computed(() => {
    let synced = 0
    let notSynced = 0
    for (const item of activeItems.value) {
      if (item.isSynced) synced++
      else notSynced++
    }
    return {
      all: activeItems.value.length,
      synced,
      notSynced
    }
  })

  // Filtered and sorted items
  const filteredItems = computed(() => {
    let result = [...activeItems.value]

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.model.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
      )
    }

    if (typeFilter.value !== 'ALL') {
      result = result.filter((item) =>
        item.type.toLowerCase().includes(typeFilter.value.toLowerCase())
      )
    }

    if (erpSyncFilter.value === 'SYNCED') {
      result = result.filter((item) => Boolean(item.isSynced))
    } else if (erpSyncFilter.value === 'NOT_SYNCED') {
      result = result.filter((item) => !item.isSynced)
    }

    if (sortBy.value === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy.value === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy.value === 'name') {
      result.sort((a, b) => (a.model || a.description).localeCompare(b.model || b.description))
    }

    return result
  })

  // Total catalog statistics
  const stats = computed(() => {
    let totalItems = 0
    let minPrice = Infinity
    let maxPrice = 0

    for (const list of Object.values(allItems.value)) {
      totalItems += list.length
      for (const item of list) {
        if (item.price > 0) {
          if (item.price < minPrice) minPrice = item.price
          if (item.price > maxPrice) maxPrice = item.price
        }
      }
    }

    return {
      totalCategories: categories.value.length,
      totalItems,
      activeCategoryCount: activeItems.value.length,
      filteredCount: filteredItems.value.length,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice
    }
  })

  return {
    categories,
    activeCatalog,
    setCatalog,
    mvgCategories,
    avCategories,
    currentCatalogCategories,
    activeCategoryId,
    currentCategory,
    activeItems,
    filteredItems,
    availableTypes,
    stats,
    isLoading,
    isSyncing,
    isLiveConnected,
    lastSyncTime,
    searchQuery,
    typeFilter,
    selectedGudang,
    warehouseList,
    refreshLiveStock,
    getItemAvailableStock,
    erpSyncFilter,
    erpSyncCounts,
    sortBy,
    updatedItemIds,
    loadData,
    triggerSync
  }
}
