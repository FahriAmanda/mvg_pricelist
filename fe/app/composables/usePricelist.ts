import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { PricelistItem, SheetCategory } from '../types/pricelist'

export function usePricelist() {
  const categories = ref<SheetCategory[]>([])
  const activeCatalog = ref<'mvg' | 'av'>('mvg')
  const activeCategoryId = ref<string>('mvg_rental_qiangli')
  const allItems = ref<Record<string, PricelistItem[]>>({})
  const isLoading = ref<boolean>(false)
  const isSyncing = ref<boolean>(false)
  const isLiveConnected = ref<boolean>(false)
  const lastSyncTime = ref<string>('')
  const searchQuery = ref<string>('')
  const typeFilter = ref<string>('ALL')
  const sortBy = ref<'default' | 'price-asc' | 'price-desc' | 'name'>('default')
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

  // Fetch initial categories and data
  async function loadData(force = false) {
    isLoading.value = true
    try {
      const catRes = await $fetch<{
        categories: SheetCategory[]
        lastSync: string
        hash: string
        totalItems: number
      }>('/api/sheets')

      categories.value = catRes.categories
      lastSyncTime.value = catRes.lastSync

      // Ensure active category matches active catalog if not set properly
      if (categories.value.length > 0) {
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

      const dataRes = await $fetch<{
        itemsByCategory: Record<string, PricelistItem[]>
        lastSync: string
        hash: string
      }>('/api/sheets/all')

      allItems.value = dataRes.itemsByCategory || {}
      lastSyncTime.value = dataRes.lastSync
    } catch (err) {
      console.error('Failed to load pricelist data:', err)
    } finally {
      isLoading.value = false
    }
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

          // Highlight changed items
          const dataRes = await $fetch<{
            itemsByCategory: Record<string, PricelistItem[]>
          }>('/api/sheets/all')

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

  // Fallback poller every 60s
  function startPolling() {
    if (import.meta.server) return
    pollInterval = setInterval(async () => {
      try {
        const catRes = await $fetch<{ lastSync: string }>('/api/sheets')
        if (catRes.lastSync !== lastSyncTime.value) {
          lastSyncTime.value = catRes.lastSync
          const dataRes = await $fetch<{
            itemsByCategory: Record<string, PricelistItem[]>
          }>('/api/sheets/all')
          allItems.value = dataRes.itemsByCategory || {}
        }
      } catch (e) {
        // quiet error
      }
    }, 60000)
  }

  onMounted(() => {
    loadData()
    connectSSE()
    startPolling()
  })

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (pollInterval) {
      clearInterval(pollInterval)
    }
  })

  // Watch active category and sync activeCatalog
  watch(
    () => activeCategoryId.value,
    (newCatId) => {
      if (newCatId && categories.value.length > 0) {
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
    const targetCats = catalog === 'mvg' ? mvgCategories.value : avCategories.value
    if (targetCats.length > 0) {
      const stillInCatalog = targetCats.some((c) => c.id === activeCategoryId.value)
      if (!stillInCatalog) {
        activeCategoryId.value = targetCats[0].id
      }
    }
  }

  // Active Category metadata
  const currentCategory = computed(() => {
    return (
      categories.value.find((c) => c.id === activeCategoryId.value) ||
      categories.value[0] || {
        id: activeCategoryId.value,
        name: activeCategoryId.value,
        catalog: activeCatalog.value,
        gid: '',
        icon: 'Box',
        description: '',
        itemCount: 0,
        lastUpdated: ''
      }
    )
  })

  // Raw items for active category
  const activeItems = computed(() => {
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
    sortBy,
    updatedItemIds,
    loadData,
    triggerSync
  }
}
