import { ref, computed, watch } from 'vue'
import type { PricelistItem } from '~~/types/pricelist'

export interface CartItem {
  id: string
  cartKey: string
  sku: string
  model: string
  price: number
  priceFormatted: string
  qty: number
  image?: string
  category: string
  catalog?: 'mvg' | 'av'
  erpItemId?: string
  availableStock?: number
  batchNumber?: string
  warehouseName?: string
  warehouseId?: string
  batchAvailableStock?: number
}

export interface AddToCartOptions {
  qty?: number
  batchNumber?: string
  warehouseName?: string
  warehouseId?: string
  batchAvailableStock?: number
}

// Global reactive state shared across all components
const cartItems = ref<CartItem[]>([])
const isCartOpen = ref(false)
const isInitialized = ref(false)

const STORAGE_KEY = 'mvg_pricelist_cart_v2'

function generateCartKey(sku: string, batchNumber?: string, warehouseId?: string): string {
  const cleanBatch = String(batchNumber || '').trim() || 'NO_BATCH'
  const cleanWh = String(warehouseId || '').trim() || 'NO_WH'
  return `${sku}__${cleanBatch}__${cleanWh}`
}

function initCart() {
  if (isInitialized.value || !import.meta.client) return
  isInitialized.value = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cartItems.value = parsed
          .filter(item => item && item.sku && item.qty > 0)
          .map(item => ({
            ...item,
            cartKey: item.cartKey || generateCartKey(item.sku, item.batchNumber, item.warehouseId)
          }))
      }
    }
  } catch (err) {
    console.warn('Failed to parse cart from localStorage:', err)
  }

  watch(
    cartItems,
    (items) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch (err) {
        console.warn('Failed to save cart to localStorage:', err)
      }
    },
    { deep: true }
  )
}

export function useCart() {
  initCart()

  const totalCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  })

  const totalPrice = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0)
  })

  const totalPriceFormatted = computed(() => {
    return 'Rp ' + Math.round(totalPrice.value).toLocaleString('id-ID')
  })

  function isInCart(sku: string, batchNumber?: string): boolean {
    if (batchNumber) {
      return cartItems.value.some(item => item.sku === sku && item.batchNumber === batchNumber)
    }
    return cartItems.value.some(item => item.sku === sku)
  }

  function getItemQty(sku: string): number {
    return cartItems.value
      .filter(item => item.sku === sku)
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  }

  function addToCart(item: PricelistItem, options: number | AddToCartOptions = 1) {
    if (!item.isSynced) {
      return { success: false, message: 'Item belum disinkronkan dengan ERP.' }
    }

    const opts: AddToCartOptions = typeof options === 'number' ? { qty: options } : (options || {})
    const requestedQty = Math.max(1, Number(opts.qty) || 1)
    const batchNumber = opts.batchNumber ? String(opts.batchNumber).trim() : undefined
    const warehouseName = opts.warehouseName ? String(opts.warehouseName).trim() : undefined
    const warehouseId = opts.warehouseId ? String(opts.warehouseId).trim() : undefined
    const batchAvailableStock = typeof opts.batchAvailableStock === 'number' ? opts.batchAvailableStock : undefined

    const cartKey = generateCartKey(item.sku, batchNumber, warehouseId)
    const existingIndex = cartItems.value.findIndex(ci => ci.cartKey === cartKey || (!ci.cartKey && ci.sku === item.sku))

    if (existingIndex !== -1) {
      const current = cartItems.value[existingIndex]
      const maxAllowed = batchAvailableStock !== undefined ? batchAvailableStock : (item.availableStock || 999999)
      const newQty = current.qty + requestedQty
      current.qty = Math.min(newQty, maxAllowed)
      current.cartKey = cartKey
      if (batchNumber) current.batchNumber = batchNumber
      if (warehouseName) current.warehouseName = warehouseName
      if (warehouseId) current.warehouseId = warehouseId
      if (batchAvailableStock !== undefined) current.batchAvailableStock = batchAvailableStock
    } else {
      const maxAllowed = batchAvailableStock !== undefined ? batchAvailableStock : (item.availableStock || 999999)
      cartItems.value.push({
        id: item.id,
        cartKey,
        sku: item.sku,
        model: item.model,
        price: Number(item.price) || 0,
        priceFormatted: item.priceFormatted || ('Rp ' + Number(item.price || 0).toLocaleString('id-ID')),
        qty: Math.min(requestedQty, maxAllowed),
        image: item.image,
        category: item.category,
        catalog: item.catalog,
        erpItemId: item.erpItemId,
        availableStock: item.availableStock,
        batchNumber,
        warehouseName,
        warehouseId,
        batchAvailableStock
      })
    }
    return { success: true }
  }

  function updateQty(cartKeyOrSku: string, qty: number) {
    const existingIndex = cartItems.value.findIndex(ci => ci.cartKey === cartKeyOrSku || ci.sku === cartKeyOrSku)
    if (existingIndex !== -1) {
      if (qty <= 0) {
        cartItems.value.splice(existingIndex, 1)
      } else {
        const item = cartItems.value[existingIndex]
        const maxAllowed = item.batchAvailableStock !== undefined ? item.batchAvailableStock : (item.availableStock || 999999)
        item.qty = Math.min(Math.floor(qty), maxAllowed)
      }
    }
  }

  function incrementQty(cartKeyOrSku: string) {
    const existing = cartItems.value.find(ci => ci.cartKey === cartKeyOrSku || ci.sku === cartKeyOrSku)
    if (existing) {
      const maxAllowed = existing.batchAvailableStock !== undefined ? existing.batchAvailableStock : (existing.availableStock || 999999)
      if (existing.qty < maxAllowed) {
        existing.qty += 1
      }
    }
  }

  function decrementQty(cartKeyOrSku: string) {
    const existingIndex = cartItems.value.findIndex(ci => ci.cartKey === cartKeyOrSku || ci.sku === cartKeyOrSku)
    if (existingIndex !== -1) {
      if (cartItems.value[existingIndex].qty <= 1) {
        cartItems.value.splice(existingIndex, 1)
      } else {
        cartItems.value[existingIndex].qty -= 1
      }
    }
  }

  function removeFromCart(cartKeyOrSku: string) {
    const existingIndex = cartItems.value.findIndex(ci => ci.cartKey === cartKeyOrSku || ci.sku === cartKeyOrSku)
    if (existingIndex !== -1) {
      cartItems.value.splice(existingIndex, 1)
    }
  }

  function clearCart() {
    cartItems.value = []
  }

  function openCart() {
    isCartOpen.value = true
  }

  function closeCart() {
    isCartOpen.value = false
  }

  function toggleCart() {
    isCartOpen.value = !isCartOpen.value
  }

  /**
   * Generates redirect URL to ERP Sales Quotation form
   */
  function proceedToErpSalesQuotation(): { url: string; error?: string } {
    if (cartItems.value.length === 0) {
      return { url: '', error: 'Keranjang masih kosong.' }
    }

    const payload = {
      from: 'pricelist_cart',
      source: 'PRICELIST_MITRAVISUALGROUP',
      tipe: 'RETAIL',
      timestamp: Date.now(),
      items: cartItems.value.map(ci => ({
        m_items_id: ci.erpItemId,
        kode_item: ci.sku,
        nama_item: ci.model,
        qty: ci.qty,
        harga: ci.price,
        satuan: 'PCS',
        batch_number: ci.batchNumber || '',
        m_gudang_id: ci.warehouseId || '',
        nama_gudang: ci.warehouseName || ''
      }))
    }

    const encoded = encodeURIComponent(JSON.stringify(payload))

    // Determine target host based on current environment
    let erpOrigin = 'https://erp.mitravisualgroup.com'
    if (import.meta.client) {
      const host = window.location.hostname
      if (host === 'localhost' || host === '127.0.0.1') {
        erpOrigin = 'http://localhost:5173'
      } else if (host.includes('dev')) {
        erpOrigin = 'https://dev-erp.mitravisualgroup.com'
      }
    }

    const targetUrl = `${erpOrigin}/marketing/transaksi/t_sales_quotation/form?from=pricelist_cart&cart=${encoded}`
    return { url: targetUrl }
  }

  return {
    cartItems,
    isCartOpen,
    totalCount,
    totalPrice,
    totalPriceFormatted,
    isInCart,
    getItemQty,
    addToCart,
    updateQty,
    incrementQty,
    decrementQty,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    proceedToErpSalesQuotation
  }
}
