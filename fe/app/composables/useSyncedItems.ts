import { ref, computed } from 'vue'

export interface SyncedPricelistItem {
  id: string
  pricelist: {
    category_id: string
    category_name: string
    catalog: 'mvg' | 'av' | string
    item_key: string
    sku: string
    model: string
    type: string
    description: string
    price: number
    image: string | null
  }
  erp: {
    m_items_id: string
    kode_item: string
    nama_item: string
    nama_alias: string | null
    spesifikasi: string
    uom: string
    m_group_category_id: string | null
    group_category_name: string
    m_group_brand_id: string | null
    group_brand_name: string
    m_group_item_id: string | null
    group_model_name: string
    m_group_type_id: string | null
    group_type_name: string
    m_group_details_id: string | null
    group_details_name: string
    m_group_details_1_id: string | null
    group_detail2_name: string
    m_group_size_id: string | null
    group_size_name: string
    m_group_details_2_id: string | null
    group_detail3_name: string
    harga_cash: number
    harga_kredit: number | null
    bt_price: number | null
    available_stock: number
    physical_stock: number
    locked_stock: number
    batches: Array<{
      batch_number: string
      m_gudang_id: string
      nama_gudang: string
      kode_gudang: string
      available_stock: number
      physical_stock: number
      locked_stock: number
    }>
  }
  audit: {
    is_sku_match: boolean
    is_price_match: boolean
    price_diff: number
    is_name_match: boolean
  }
}

export interface WarehouseOption {
  id: string
  kode_gudang: string
  nama_gudang: string
}

export function useSyncedItems() {
  const items = ref<SyncedPricelistItem[]>([])
  const warehouses = ref<WarehouseOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncTime = ref<string>('')

  // Search & Filter state
  const searchQuery = ref('')
  const activeSearch = ref('')
  const selectedWarehouse = ref('ALL')

  // 8-Level cascading group filters
  const filterCategory = ref('ALL')
  const filterBrand = ref('ALL')
  const filterModel = ref('ALL')
  const filterType = ref('ALL')
  const filterDetails = ref('ALL')
  const filterDetail2 = ref('ALL')
  const filterSize = ref('ALL')
  const filterDetail3 = ref('ALL')

  // Audit filter: 'ALL' | 'MATCH' | 'PRICE_DIFF' | 'SKU_DIFF'
  const auditFilter = ref<'ALL' | 'MATCH' | 'PRICE_DIFF' | 'SKU_DIFF'>('ALL')

  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(25)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{
        status: string
        total: number
        warehouses: WarehouseOption[]
        data: SyncedPricelistItem[]
        synced_at: string
      }>('/api/erp/synced-items')

      if (res && res.status === 'success') {
        items.value = res.data || []
        warehouses.value = res.warehouses || []
        lastSyncTime.value = res.synced_at || new Date().toISOString()
      } else {
        throw new Error('Gagal memuat data sinkronisasi')
      }
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Gagal terhubung ke backend ERP'
    } finally {
      loading.value = false
    }
  }

  function applySearch() {
    activeSearch.value = searchQuery.value.trim()
    currentPage.value = 1
  }

  function resetFilters() {
    searchQuery.value = ''
    activeSearch.value = ''
    selectedWarehouse.value = 'ALL'
    filterCategory.value = 'ALL'
    filterBrand.value = 'ALL'
    filterModel.value = 'ALL'
    filterType.value = 'ALL'
    filterDetails.value = 'ALL'
    filterDetail2.value = 'ALL'
    filterSize.value = 'ALL'
    filterDetail3.value = 'ALL'
    auditFilter.value = 'ALL'
    currentPage.value = 1
  }

  // Extract distinct options for each of the 8 levels
  const categoryOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (item.erp.m_group_category_id && item.erp.group_category_name && item.erp.group_category_name !== '-') {
        map.set(item.erp.m_group_category_id, item.erp.group_category_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const brandOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (item.erp.m_group_brand_id && item.erp.group_brand_name && item.erp.group_brand_name !== '-') {
        map.set(item.erp.m_group_brand_id, item.erp.group_brand_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const modelOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (item.erp.m_group_item_id && item.erp.group_model_name && item.erp.group_model_name !== '-') {
        map.set(item.erp.m_group_item_id, item.erp.group_model_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const typeOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (filterModel.value !== 'ALL' && item.erp.m_group_item_id !== filterModel.value) continue
      if (item.erp.m_group_type_id && item.erp.group_type_name && item.erp.group_type_name !== '-') {
        map.set(item.erp.m_group_type_id, item.erp.group_type_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const detailsOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (filterModel.value !== 'ALL' && item.erp.m_group_item_id !== filterModel.value) continue
      if (filterType.value !== 'ALL' && item.erp.m_group_type_id !== filterType.value) continue
      if (item.erp.m_group_details_id && item.erp.group_details_name && item.erp.group_details_name !== '-') {
        map.set(item.erp.m_group_details_id, item.erp.group_details_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const detail2Options = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (filterModel.value !== 'ALL' && item.erp.m_group_item_id !== filterModel.value) continue
      if (filterType.value !== 'ALL' && item.erp.m_group_type_id !== filterType.value) continue
      if (filterDetails.value !== 'ALL' && item.erp.m_group_details_id !== filterDetails.value) continue
      if (item.erp.m_group_details_1_id && item.erp.group_detail2_name && item.erp.group_detail2_name !== '-') {
        map.set(item.erp.m_group_details_1_id, item.erp.group_detail2_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const sizeOptions = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (filterModel.value !== 'ALL' && item.erp.m_group_item_id !== filterModel.value) continue
      if (filterType.value !== 'ALL' && item.erp.m_group_type_id !== filterType.value) continue
      if (filterDetails.value !== 'ALL' && item.erp.m_group_details_id !== filterDetails.value) continue
      if (filterDetail2.value !== 'ALL' && item.erp.m_group_details_1_id !== filterDetail2.value) continue
      if (item.erp.m_group_size_id && item.erp.group_size_name && item.erp.group_size_name !== '-') {
        map.set(item.erp.m_group_size_id, item.erp.group_size_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  const detail3Options = computed(() => {
    const map = new Map<string, string>()
    for (const item of items.value) {
      if (filterCategory.value !== 'ALL' && item.erp.m_group_category_id !== filterCategory.value) continue
      if (filterBrand.value !== 'ALL' && item.erp.m_group_brand_id !== filterBrand.value) continue
      if (filterModel.value !== 'ALL' && item.erp.m_group_item_id !== filterModel.value) continue
      if (filterType.value !== 'ALL' && item.erp.m_group_type_id !== filterType.value) continue
      if (filterDetails.value !== 'ALL' && item.erp.m_group_details_id !== filterDetails.value) continue
      if (filterDetail2.value !== 'ALL' && item.erp.m_group_details_1_id !== filterDetail2.value) continue
      if (filterSize.value !== 'ALL' && item.erp.m_group_size_id !== filterSize.value) continue
      if (item.erp.m_group_details_2_id && item.erp.group_detail3_name && item.erp.group_detail3_name !== '-') {
        map.set(item.erp.m_group_details_2_id, item.erp.group_detail3_name)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  // Filtered items logic
  const filteredItems = computed(() => {
    let result = items.value

    // 8-Level group filtering
    if (filterCategory.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_category_id === filterCategory.value)
    }
    if (filterBrand.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_brand_id === filterBrand.value)
    }
    if (filterModel.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_item_id === filterModel.value)
    }
    if (filterType.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_type_id === filterType.value)
    }
    if (filterDetails.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_details_id === filterDetails.value)
    }
    if (filterDetail2.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_details_1_id === filterDetail2.value)
    }
    if (filterSize.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_size_id === filterSize.value)
    }
    if (filterDetail3.value !== 'ALL') {
      result = result.filter(i => i.erp.m_group_details_2_id === filterDetail3.value)
    }

    // Warehouse filter
    if (selectedWarehouse.value !== 'ALL') {
      result = result.filter(i => {
        return (i.erp.batches || []).some(b => {
          return (b.m_gudang_id === selectedWarehouse.value || b.nama_gudang === selectedWarehouse.value || b.kode_gudang === selectedWarehouse.value) && Number(b.available_stock || 0) > 0
        })
      })
    }

    // Audit status filter
    if (auditFilter.value === 'MATCH') {
      result = result.filter(i => i.audit.is_sku_match && i.audit.is_price_match)
    } else if (auditFilter.value === 'PRICE_DIFF') {
      result = result.filter(i => !i.audit.is_price_match)
    } else if (auditFilter.value === 'SKU_DIFF') {
      result = result.filter(i => !i.audit.is_sku_match)
    }

    // Search query filter
    const query = activeSearch.value.toLowerCase()
    if (query) {
      result = result.filter(i => {
        const plSku = (i.pricelist.sku || '').toLowerCase()
        const plModel = (i.pricelist.model || '').toLowerCase()
        const plType = (i.pricelist.type || '').toLowerCase()
        const erpCode = (i.erp.kode_item || '').toLowerCase()
        const erpName = (i.erp.nama_item || '').toLowerCase()
        const erpSpec = (i.erp.spesifikasi || '').toLowerCase()
        const erpAlias = (i.erp.nama_alias || '').toLowerCase()
        const erpCat = (i.erp.group_category_name || '').toLowerCase()
        const erpBrand = (i.erp.group_brand_name || '').toLowerCase()
        const batchMatch = (i.erp.batches || []).some(b => {
          return (b.batch_number || '').toLowerCase().includes(query) || (b.nama_gudang || '').toLowerCase().includes(query)
        })

        return (
          plSku.includes(query) ||
          plModel.includes(query) ||
          plType.includes(query) ||
          erpCode.includes(query) ||
          erpName.includes(query) ||
          erpSpec.includes(query) ||
          erpAlias.includes(query) ||
          erpCat.includes(query) ||
          erpBrand.includes(query) ||
          batchMatch
        )
      })
    }

    return result
  })

  // Summary statistics
  const summary = computed(() => {
    const total = items.value.length
    const match = items.value.filter(i => i.audit.is_sku_match && i.audit.is_price_match).length
    const priceDiff = items.value.filter(i => !i.audit.is_price_match).length
    const skuDiff = items.value.filter(i => !i.audit.is_sku_match).length
    const totalStock = items.value.reduce((acc, i) => acc + (i.erp.available_stock || 0), 0)

    return {
      total,
      match,
      priceDiff,
      skuDiff,
      totalStock
    }
  })

  // Pagination
  const totalPages = computed(() => {
    return Math.ceil(filteredItems.value.length / pageSize.value) || 1
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
  })

  return {
    items,
    warehouses,
    loading,
    error,
    lastSyncTime,
    searchQuery,
    activeSearch,
    selectedWarehouse,
    filterCategory,
    filterBrand,
    filterModel,
    filterType,
    filterDetails,
    filterDetail2,
    filterSize,
    filterDetail3,
    auditFilter,
    currentPage,
    pageSize,
    categoryOptions,
    brandOptions,
    modelOptions,
    typeOptions,
    detailsOptions,
    detail2Options,
    sizeOptions,
    detail3Options,
    filteredItems,
    paginatedItems,
    totalPages,
    summary,
    fetchItems,
    applySearch,
    resetFilters
  }
}
