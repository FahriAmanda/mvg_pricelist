import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { PricelistItem, SheetCategory } from '../types/pricelist'

export function usePricelist() {
  const categories = ref<SheetCategory[]>([])
  const activeCategoryId = ref<string>('qiangli')
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

          // Auto-clear highlight after 5 seconds
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
        // Reconnect after 5 seconds
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
          const dataRes = await $fetch<{ itemsByCategory: Record<string, PricelistItem[]> }>('/api/sheets/all')
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

  // Active Category metadata
  const currentCategory = computed(() => {
    return categories.value.find((c) => c.id === activeCategoryId.value) || categories.value[0]
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
        // Clean type (Indoor, Outdoor, Flexible, Controller, etc.)
        const simple = item.type.split(/[\(\/-]/)[0].trim()
        if (simple) set.add(simple)
      }
    }
    return Array.from(set)
  })

  // Filtered and sorted items
  const filteredItems = computed(() => {
    let result = [...activeItems.value]

    // Search query (matches model, type, description, sku)
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

    // Type filter
    if (typeFilter.value !== 'ALL') {
      result = result.filter((item) =>
        item.type.toLowerCase().includes(typeFilter.value.toLowerCase())
      )
    }

    // Sorting
    if (sortBy.value === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy.value === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy.value === 'name') {
      result.sort((a, b) => (a.description || a.type).localeCompare(b.description || b.type))
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
