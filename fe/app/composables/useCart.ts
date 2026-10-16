import { ref, computed, watch } from 'vue'
import type { PricelistItem } from '~~/types/pricelist'

export interface CartItem {
  id: string
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
}

// Global reactive state shared across all components
const cartItems = ref<CartItem[]>([])
const isCartOpen = ref(false)
const isInitialized = ref(false)

const STORAGE_KEY = 'mvg_pricelist_cart_v1'

function initCart() {
  if (isInitialized.value || !import.meta.client) return
  isInitialized.value = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cartItems.value = parsed.filter(item => item && item.sku && item.qty > 0)
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

  function isInCart(sku: string): boolean {
    return cartItems.value.some(item => item.sku === sku)
  }

  function getItemQty(sku: string): number {
    const found = cartItems.value.find(item => item.sku === sku)
    return found ? found.qty : 0
  }

  function addToCart(item: PricelistItem, qty = 1) {
    if (!item.isSynced) {
      return { success: false, message: 'Item belum disinkronkan dengan ERP.' }
    }

    const existingIndex = cartItems.value.findIndex(ci => ci.sku === item.sku)
    if (existingIndex !== -1) {
      cartItems.value[existingIndex].qty += qty
    } else {
      cartItems.value.push({
        id: item.id,
        sku: item.sku,
        model: item.model,
        price: Number(item.price) || 0,
        priceFormatted: item.priceFormatted || ('Rp ' + Number(item.price || 0).toLocaleString('id-ID')),
        qty: Math.max(1, qty),
        image: item.image,
        category: item.category,
        catalog: item.catalog,
        erpItemId: item.erpItemId,
        availableStock: item.availableStock
      })
    }
    return { success: true }
  }

  function updateQty(sku: string, qty: number) {
    const existingIndex = cartItems.value.findIndex(ci => ci.sku === sku)
    if (existingIndex !== -1) {
      if (qty <= 0) {
        cartItems.value.splice(existingIndex, 1)
      } else {
        cartItems.value[existingIndex].qty = Math.floor(qty)
      }
    }
  }

  function incrementQty(sku: string) {
    const existing = cartItems.value.find(ci => ci.sku === sku)
    if (existing) {
      existing.qty += 1
    }
  }

  function decrementQty(sku: string) {
    const existingIndex = cartItems.value.findIndex(ci => ci.sku === sku)
    if (existingIndex !== -1) {
      if (cartItems.value[existingIndex].qty <= 1) {
        cartItems.value.splice(existingIndex, 1)
      } else {
        cartItems.value[existingIndex].qty -= 1
      }
    }
  }

  function removeFromCart(sku: string) {
    const existingIndex = cartItems.value.findIndex(ci => ci.sku === sku)
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
        satuan: 'PCS'
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
