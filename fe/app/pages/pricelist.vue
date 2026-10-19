<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  RefreshCw,
  Search,
  Cpu,
  Layers,
  Server,
  Sparkles,
  Zap,
  Box,
  Plug,
  Tv,
  Boxes,
  ShieldCheck,
  Flame,
  ArrowDownUp,
  Sun,
  Shield,
  ShieldAlert,
  Cable,
  Check,
  Copy,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Video,
  LogOut,
  ZoomIn,
  FileText,
  ExternalLink,
  FileDown,
  X,
  Images,
  ArrowUp,
  List,
  ShoppingCart
} from '@lucide/vue'
import { usePricelist } from '~/composables/usePricelist'
import { useAuthStore } from '~/stores/auth'
import { useCart } from '~/composables/useCart'
import ThemeToggle from '~/components/ThemeToggle.vue'
import FieldSelect from '~/components/FieldSelect.vue'
import CartDrawer from '~/components/CartDrawer.vue'
import BatchSelectDialog from '~/components/BatchSelectDialog.vue'
import type { ErpBatchItem } from '~/types/pricelist'

const authStore = useAuthStore()
const isSuperAdmin = computed(() => {
  const role = (authStore.user?.roleName || '').trim().toUpperCase()
  return role === 'SUPER ADMIN' || role === 'SUPERADMIN'
})
const cart = useCart()

// Batch Selection Modal State
const selectedItemForBatch = ref<PricelistItem | null>(null)
const isBatchDialogOpen = ref(false)

function handleAddToCart(item: PricelistItem) {
  const availStock = getItemAvailableStock(item)
  if (item.sellable !== true || !item.isSynced || availStock <= 0) return
  const availableBatches = (item.batches || []).filter(b => {
    const hasStock = Number(b.available_stock || 0) > 0
    if (!hasStock) return false
    if (!selectedGudang.value || selectedGudang.value === 'ALL') return true
    return b.nama_gudang === selectedGudang.value || b.m_gudang_id === selectedGudang.value || b.kode_gudang === selectedGudang.value
  })
  if (availableBatches.length > 0) {
    selectedItemForBatch.value = item
    isBatchDialogOpen.value = true
  } else {
    cart.addToCart(item, 1)
    cart.openCart()
  }
}

function onBatchDialogConfirm(payload: { item: PricelistItem; qty: number; batch: ErpBatchItem | null }) {
  cart.addToCart(payload.item, {
    qty: payload.qty,
    batchNumber: payload.batch?.batch_number,
    warehouseName: payload.batch?.nama_gudang,
    warehouseId: payload.batch?.m_gudang_id,
    batchAvailableStock: payload.batch?.available_stock
  })
  cart.openCart()
}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { PricelistItem } from '~/types/pricelist'

const route = useRoute()
const router = useRouter()

// 1. Initial State from URL Query Parameters
const queryCatalog = route.query.catalog as string
const queryCategory = route.query.category as string
const queryView = route.query.view as string
const queryType = route.query.type as string
const querySearch = route.query.search as string
const querySort = route.query.sort as string
const queryErpSync = (route.query.erp_sync as string)?.toUpperCase()

let initialCatalog: 'mvg' | 'av' = 'mvg'
if (queryCatalog === 'av' || queryCatalog === 'mvg') {
  initialCatalog = queryCatalog
} else if (queryCategory) {
  if (queryCategory.startsWith('mvg_')) {
    initialCatalog = 'mvg'
  } else if (
    ['qiangli', 'lampro', 'huidu', 'colorlight', 'novastar', 'cabinet', 'psu', 'led_poster', 'led_cube', 'magnustek_tkdn'].includes(queryCategory)
  ) {
    initialCatalog = 'av'
  }
}

const initialCategory = queryCategory || (initialCatalog === 'av' ? 'qiangli' : 'mvg_rental_qiangli')

function goToDetail(itemId: string) {
  if (!itemId) return
  router.push({
    path: `/item/${itemId}`,
    query: {
      fromCatalog: activeCatalog.value,
      fromCategory: activeCategoryId.value,
      fromView: viewMode.value
    }
  })
}

const {
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
  updatedItemIds
} = usePricelist({
  catalog: initialCatalog,
  categoryId: initialCategory,
  type: queryType || 'ALL',
  erpSync: (queryErpSync === 'SYNCED' || queryErpSync === 'NOT_SYNCED') ? queryErpSync : 'ALL',
  search: querySearch || '',
  sort: (querySort as any) || 'default'
})

const queryGudang = (route.query.gudang as string) || ''
if (queryGudang) {
  selectedGudang.value = queryGudang
}

// Display View Mode: 'cards' or 'table'
const viewMode = ref<'cards' | 'table'>(queryView === 'table' ? 'table' : 'cards')

// 2. Synchronize State to URL Query Parameters
function syncStateToUrl() {
  const nextQuery: Record<string, string> = {
    catalog: activeCatalog.value,
    category: activeCategoryId.value
  }

  if (viewMode.value === 'table') {
    nextQuery.view = 'table'
  }
  if (typeFilter.value && typeFilter.value !== 'ALL') {
    nextQuery.type = typeFilter.value
  }
  if (selectedGudang.value && selectedGudang.value !== 'ALL') {
    nextQuery.gudang = selectedGudang.value
  }
  if (erpSyncFilter.value && erpSyncFilter.value !== 'ALL') {
    nextQuery.erp_sync = erpSyncFilter.value.toLowerCase()
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    nextQuery.search = searchQuery.value.trim()
  }
  if (sortBy.value && sortBy.value !== 'default') {
    nextQuery.sort = sortBy.value
  }

  const curr = route.query
  const isSame =
    curr.catalog === nextQuery.catalog &&
    curr.category === nextQuery.category &&
    (curr.view || 'cards') === (nextQuery.view || 'cards') &&
    (curr.type || 'ALL') === (nextQuery.type || 'ALL') &&
    (curr.erp_sync || 'all') === (nextQuery.erp_sync || 'all') &&
    (curr.search || '') === (nextQuery.search || '') &&
    (curr.sort || 'default') === (nextQuery.sort || 'default')

  if (!isSame) {
    router.replace({ query: nextQuery }).catch(() => {})
  }
}

// Watch state changes and sync to URL query
watch([activeCatalog, activeCategoryId, viewMode, typeFilter, selectedGudang, erpSyncFilter, sortBy], () => {
  syncStateToUrl()
})

let searchDebounceTimer: any = null
watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    syncStateToUrl()
  }, 250)
})

// Watch URL changes (e.g. browser Back / Forward buttons) and sync to state
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.catalog && (newQuery.catalog === 'mvg' || newQuery.catalog === 'av')) {
      if (activeCatalog.value !== newQuery.catalog) {
        activeCatalog.value = newQuery.catalog
      }
    }
    if (newQuery.category && typeof newQuery.category === 'string') {
      if (activeCategoryId.value !== newQuery.category) {
        activeCategoryId.value = newQuery.category
      }
    }
    if (newQuery.view && (newQuery.view === 'cards' || newQuery.view === 'table')) {
      if (viewMode.value !== newQuery.view) {
        viewMode.value = newQuery.view
      }
    }
    if (newQuery.type && typeof newQuery.type === 'string') {
      if (typeFilter.value !== newQuery.type) {
        typeFilter.value = newQuery.type
      }
    }
    if (newQuery.gudang && typeof newQuery.gudang === 'string') {
      if (selectedGudang.value !== newQuery.gudang) {
        selectedGudang.value = newQuery.gudang
      }
    } else if (!newQuery.gudang && selectedGudang.value !== 'ALL') {
      selectedGudang.value = 'ALL'
    }
    if (typeof newQuery.search === 'string') {
      if (searchQuery.value !== newQuery.search) {
        searchQuery.value = newQuery.search
      }
    } else if (!newQuery.search && searchQuery.value) {
      searchQuery.value = ''
    }
    if (newQuery.sort && typeof newQuery.sort === 'string') {
      if (sortBy.value !== newQuery.sort) {
        sortBy.value = newQuery.sort as any
      }
    }
  },
  { deep: true }
)

// Complete 21 Categories Icon Mapping
const categoryIcons: Record<string, any> = {
  // PRICELIST MVG
  mvg_rental_qiangli: Tv,
  mvg_rental_fabulux: Tv,
  mvg_rental_maven: Layers,
  mvg_moka_effect: Flame,
  mvg_mode_hoist: ArrowDownUp,
  mvg_meanreal_lighting: Sun,
  mvg_alumino: Box,
  mvg_ringlock: Shield,
  mvg_gaga_laser: Zap,
  mvg_mojo_barrier: ShieldAlert,
  mvg_aksesoris_rental: Cable,
  // AV PRICE LIST
  qiangli: Cpu,
  lampro: Layers,
  huidu: Server,
  colorlight: Sparkles,
  novastar: Zap,
  cabinet: Box,
  psu: Plug,
  led_poster: Tv,
  led_cube: Boxes,
  magnustek_tkdn: ShieldCheck
}

// Total items in current catalog
const totalCatalogItems = computed(() =>
  currentCatalogCategories.value.reduce((acc, c) => acc + c.itemCount, 0)
)

// Select Options for FieldSelect
const categorySelectOptions = computed(() => [
  {
    value: 'all',
    label: `Semua Kategori (${totalCatalogItems.value} item)`
  },
  ...currentCatalogCategories.value.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.itemCount} item)`
  }))
])

// Category horizontal scroll & wrap controls
const categoryScrollRef = ref<HTMLElement | null>(null)
const isCategoryWrap = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

function updateScrollButtons() {
  const el = categoryScrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollCategory(direction: 'left' | 'right') {
  const el = categoryScrollRef.value
  if (!el) return
  const offset = direction === 'left' ? -260 : 260
  el.scrollBy({ left: offset, behavior: 'smooth' })
  setTimeout(updateScrollButtons, 250)
}

function handleCategoryWheel(e: WheelEvent) {
  const el = categoryScrollRef.value
  if (!el || isCategoryWrap.value) return
  if (e.deltaY !== 0) {
    e.preventDefault()
    el.scrollLeft += e.deltaY * 1.2
    updateScrollButtons()
  }
}

// Mouse drag-to-scroll support for desktop
let isDraggingCategory = false
let dragStartX = 0
let dragScrollLeft = 0

function onCategoryMouseDown(e: MouseEvent) {
  const el = categoryScrollRef.value
  if (!el || isCategoryWrap.value) return
  isDraggingCategory = true
  dragStartX = e.pageX - el.offsetLeft
  dragScrollLeft = el.scrollLeft
}

function onCategoryMouseMove(e: MouseEvent) {
  if (!isDraggingCategory) return
  const el = categoryScrollRef.value
  if (!el) return
  e.preventDefault()
  const x = e.pageX - el.offsetLeft
  const walk = (x - dragStartX) * 1.5
  el.scrollLeft = dragScrollLeft - walk
  updateScrollButtons()
}

function onCategoryMouseUp() {
  isDraggingCategory = false
}

onMounted(() => {
  checkScreenSize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreenSize)
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
  }
  const el = categoryScrollRef.value
  if (el) {
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    updateScrollButtons()
  }
  nextTick(() => {
    syncStateToUrl()
  })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize)
    window.removeEventListener('scroll', handleWindowScroll)
  }
})

const typeSelectOptions = computed(() => [
  { value: 'ALL', label: `Semua Tipe (${activeItems.value?.length || 0})` },
  ...availableTypes.value.map((t) => ({ value: t, label: t }))
])

const gudangSelectOptions = computed(() => {
  const opts = [{ value: 'ALL', label: 'Semua Gudang (Nasional)' }]
  for (const w of warehouseList.value) {
    opts.push({
      value: w.nama_gudang,
      label: w.nama_gudang
    })
  }
  return opts
})

const erpSyncSelectOptions = computed(() => [
  { value: 'ALL', label: `Semua Status ERP (${erpSyncCounts.value.all})` },
  { value: 'SYNCED', label: `● SYNC ERP (${erpSyncCounts.value.synced})` },
  { value: 'NOT_SYNCED', label: `● NOT SYNC ERP (${erpSyncCounts.value.notSynced})` }
])

const sortSelectOptions = [
  { value: 'default', label: 'Urutan Standar' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'name', label: 'Nama A-Z' }
]

const isMobileScreen = ref(false)
const isCategorySheetOpen = ref(false)
const mobileCardDensity = ref<'normal' | 'compact'>('normal')
const showBackToTop = ref(false)

function checkScreenSize() {
  if (typeof window !== 'undefined') {
    isMobileScreen.value = window.innerWidth < 768
    if (isMobileScreen.value) {
      viewMode.value = 'cards'
    }
  }
}

function handleWindowScroll() {
  if (typeof window !== 'undefined') {
    showBackToTop.value = window.scrollY > 350
  }
}

function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// SKU clipboard feedback
const copiedSku = ref<string | null>(null)
function copyToClipboard(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  copiedSku.value = text
  setTimeout(() => {
    if (copiedSku.value === text) {
      copiedSku.value = null
    }
  }, 2000)
}

function formatTime(isoString: string) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return isoString
  }
}

// Lightbox Modal for Product Pictures & Charts
const isLightboxOpen = ref(false)
const lightboxImage = ref<string | null>(null)
const lightboxTitle = ref<string | null>(null)
const lightboxGallery = ref<string[]>([])

function openImageLightbox(imgUrl?: string, title?: string, allImages?: string[]) {
  if (!imgUrl) return
  lightboxImage.value = imgUrl
  lightboxTitle.value = title || 'Gambar Produk'
  lightboxGallery.value = (allImages && allImages.length > 0) ? allImages : [imgUrl]
  isLightboxOpen.value = true
}

function closeImageLightbox() {
  isLightboxOpen.value = false
  lightboxImage.value = null
  lightboxTitle.value = null
  lightboxGallery.value = []
}

// QiangLi Comparison Modal & Specifications
const isComparisonModalOpen = ref(false)
const isComparisonChartOpen = ref(false)
const qiangliSpecs = [
  { parameter: 'Type', mavic: 'Flat Cable', lite: 'Flat Cable', saga: 'Hard Connection' },
  { parameter: 'Pitch', mavic: 'P3.9 Outdoor/Hybrid', lite: 'P2.6 Indoor\nP3.9 Outdoor/Hybrid', saga: 'P2.6 Indoor\nP3.9 Outdoor/Hybrid' },
  { parameter: 'Cabinet Size', mavic: '1000*500 / 500*500', lite: '1000*500 / 500*500', saga: '1000*500 / 500*500' },
  { parameter: 'Curve & Corner', mavic: 'No', lite: 'Yes', saga: 'Yes' },
  { parameter: 'PCB Layer', mavic: '2 Layer', lite: '2 Layer', saga: '4 Layer' },
  { parameter: 'Refresh Rate', mavic: 'Real 7680Hz', lite: 'Real 7680Hz', saga: 'Real 7680Hz' },
  { parameter: 'Magnetic/Screw', mavic: 'Screw', lite: 'Outdoor Screw\nIndoor Magnetic', saga: 'All Magnetic' },
  { parameter: 'Lamp', mavic: 'Kinglight', lite: 'Kinglight', saga: 'Kinglight' },
]

function handleManualSync() {
  triggerSync()
}

// Expanded state for LED Cube parts breakdown on mobile cards
const expandedCubeId = ref<string | null>(null)
function toggleCubeExpand(id: string) {
  expandedCubeId.value = expandedCubeId.value === id ? null : id
}

// Expanded state for LED Poster BOM breakdown on cards
const expandedPosterId = ref<string | null>(null)
function togglePosterExpand(id: string) {
  expandedPosterId.value = expandedPosterId.value === id ? null : id
}

// Check if current category has brochure/video links
const hasLinkColumn = computed(() => {
  if (activeCategoryId.value === 'all') return true
  if (activeCategoryId.value.includes('rental')) return true
  if (['mvg_moka_effect', 'mvg_mode_hoist', 'mvg_meanreal_lighting', 'mvg_gaga_laser'].includes(activeCategoryId.value)) return true
  return filteredItems.value.some((item) => Boolean(item.brochureUrl))
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 pb-28">
    <!-- Top Sticky Navigation (Mobile-First) -->
    <header
      v-motion
      :initial="{ opacity: 0, y: -15 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 350, ease: 'easeOut' } }"
      class="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md"
    >
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <!-- Back to Gate + Logo & Title Section -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <NuxtLink
            :to="`/?catalog=${activeCatalog}`"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Kembali ke Pilihan Kategori"
          >
            <ArrowLeft class="w-4 h-4" />
          </NuxtLink>

          <div class="flex items-center justify-center h-9 sm:h-11 rounded-xl bg-card border border-border/60 shadow-xs px-1.5 sm:px-2 py-1 shrink-0 overflow-hidden">
            <!-- Mobile Clean Icon Logo -->
            <img
              src="/mvg-logo.png"
              alt="MVG"
              class="h-6 w-6 sm:hidden object-contain"
            />
            <!-- Desktop Full Header Logo -->
            <img
              src="/mvg-header-logo.png"
              alt="Mitra Visual Group"
              class="hidden sm:block h-full w-auto object-contain dark:brightness-110"
              onerror="this.onerror=null; this.src='/mvg-logo.png';"
            />
          </div>
          <div class="shrink-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs sm:text-base font-black tracking-tight text-foreground uppercase whitespace-nowrap">
                {{ activeCatalog === 'mvg' ? 'PRICELIST MVG' : 'AV PRICE LIST' }}
              </span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p class="text-[11px] text-muted-foreground truncate hidden xs:block">
              Mitra Visual Group & Asia Visiotron
            </p>
          </div>
        </div>

        <!-- Action Tools (Mobile Thumb-Friendly) -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 text-[11px] text-muted-foreground bg-muted/30"
            :title="isLiveConnected ? 'SSE Real-time Active (Auto-sync 60s)' : 'Connecting...'"
          >
            <Clock class="w-3 h-3 text-primary" />
            <span>{{ formatTime(lastSyncTime) }}</span>
          </div>

          <div class="hidden sm:flex items-center p-0.5 rounded-lg border border-border/80 bg-muted/40">
            <button
              type="button"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'cards' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
              title="Tampilan Kartu (Mobile Grid)"
              @click="viewMode = 'cards'"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
              title="Tampilan Tabel (Desktop Spreadsheet)"
              @click="viewMode = 'table'"
            >
              <TableIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <ThemeToggle />

          <!-- User Profile & Logout -->
          <div v-if="authStore.user" class="flex items-center gap-2 pl-2 border-l border-border/70">
            <div class="hidden md:block text-right leading-tight">
              <span class="text-xs font-bold text-foreground block max-w-[130px] truncate">
                {{ authStore.user.name }}
              </span>
              <span class="text-[10px] text-muted-foreground block max-w-[130px] truncate font-mono">
                {{ authStore.user.roleName || 'Mitra Visual Group' }}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:border-rose-500/50 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Keluar (Logout)"
              @click="authStore.logout('Anda telah keluar dari sistem')"
            >
              <LogOut class="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <!-- 1. CATALOG SWITCHER TABS (PRICELIST MVG vs AV PRICE LIST) -->
      <section class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex items-center p-1 rounded-2xl bg-muted/60 border border-border/80 w-full sm:w-auto">
          <button
            type="button"
            v-motion
            :tapped="{ scale: 0.98 }"
            class="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all duration-200 flex items-center justify-center gap-2"
            :class="[
              activeCatalog === 'mvg'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="setCatalog('mvg')"
          >
            <Sparkles class="w-4 h-4" />
            <span>PRICELIST MVG</span>
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono"
              :class="activeCatalog === 'mvg' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'"
            >
              {{ mvgCategories.length }}
            </span>
          </button>

          <button
            type="button"
            v-motion
            :tapped="{ scale: 0.98 }"
            class="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all duration-200 flex items-center justify-center gap-2"
            :class="[
              activeCatalog === 'av'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="setCatalog('av')"
          >
            <Boxes class="w-4 h-4" />
            <span>AV PRICE LIST</span>
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono"
              :class="activeCatalog === 'av' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
            >
              {{ avCategories.length }}
            </span>
          </button>
        </div>

        <!-- Catalog Badge Info -->
        <div class="text-xs text-muted-foreground hidden sm:flex items-center gap-2 font-medium">
          <span>Katalog Terpilih:</span>
          <Badge variant="outline" class="font-bold uppercase tracking-wider text-[11px]">
            {{ activeCatalog === 'mvg' ? `Mitra Visual Group (${mvgCategories.length} Kategori)` : `Asia Visiotron (${avCategories.length} Kategori)` }}
          </Badge>
        </div>
      </section>

      <!-- 2. CATEGORY SWITCHER (Mobile-Optimized Single Carousel + Drawer Sheet) -->
      <section class="space-y-2">
        <!-- Section Bar: Title & Quick Drawer Button -->
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Kategori {{ activeCatalog === 'mvg' ? 'MVG' : 'AV' }}
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-muted text-muted-foreground">
              {{ currentCatalogCategories.length }}
            </span>
          </div>

          <!-- Mobile: Drawer Trigger Button -->
          <button
            type="button"
            class="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
            @click="isCategorySheetOpen = true"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Pilih Kategori ▾</span>
          </button>

          <!-- Desktop: Wrap Toggle Button -->
          <button
            type="button"
            class="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            @click="isCategoryWrap = !isCategoryWrap"
          >
            <LayoutGrid class="w-3 h-3" />
            <span>{{ isCategoryWrap ? 'Mode Geser (1 Baris)' : 'Tampilkan Semua Kategori (Buka Semua)' }}</span>
          </button>
        </div>

        <!-- Pill Bar with Scroll Controls -->
        <div class="relative group/catbar">
          <!-- Left Scroll Arrow Button (Desktop) -->
          <button
            v-if="!isCategoryWrap && canScrollLeft"
            type="button"
            class="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center bg-background/95 border border-border shadow-md hover:bg-muted text-foreground transition-all cursor-pointer"
            title="Geser ke kiri"
            @click="scrollCategory('left')"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- Right Scroll Arrow Button (Desktop) -->
          <button
            v-if="!isCategoryWrap && canScrollRight"
            type="button"
            class="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center bg-background/95 border border-border shadow-md hover:bg-muted text-foreground transition-all cursor-pointer"
            title="Geser ke kanan"
            @click="scrollCategory('right')"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <!-- The Pills Container (Always 1 row on mobile, touch-friendly swipe) -->
          <div
            ref="categoryScrollRef"
            class="py-1 transition-all"
            :class="[
              !isMobileScreen && isCategoryWrap
                ? 'flex flex-wrap items-center gap-2'
                : 'flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none snap-x'
            ]"
            :style="isMobileScreen || !isCategoryWrap ? '-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;' : ''"
            @wheel="handleCategoryWheel"
            @mousedown="onCategoryMouseDown"
            @mousemove="onCategoryMouseMove"
            @mouseup="onCategoryMouseUp"
            @mouseleave="onCategoryMouseUp"
          >
            <!-- 1. "SEMUA KATEGORI" PILL OPTION -->
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap border shrink-0 touch-manipulation active:scale-95 snap-start"
              :class="[
                activeCategoryId === 'all'
                  ? (activeCatalog === 'mvg'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/30'
                      : 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 ring-2 ring-primary/30')
                  : 'bg-card hover:bg-muted text-foreground border-border/80'
              ]"
              @click="activeCategoryId = 'all'"
            >
              <component
                :is="activeCatalog === 'mvg' ? Sparkles : Boxes"
                class="w-3.5 h-3.5 shrink-0"
                :class="activeCategoryId === 'all' ? 'text-white' : (activeCatalog === 'mvg' ? 'text-amber-500' : 'text-primary')"
              />
              <span>Semua Kategori</span>
              <span
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono"
                :class="activeCategoryId === 'all' ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'"
              >
                {{ totalCatalogItems }}
              </span>
            </button>

            <!-- 2. INDIVIDUAL CATEGORY PILLS -->
            <button
              v-for="cat in currentCatalogCategories"
              :key="cat.id"
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap border shrink-0 touch-manipulation active:scale-95 snap-start"
              :class="[
                activeCategoryId === cat.id
                  ? (activeCatalog === 'mvg'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25 ring-2 ring-amber-500/30 font-bold'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25 ring-2 ring-primary/30 font-bold')
                  : 'bg-card hover:bg-muted text-foreground border-border/70'
              ]"
              @click="activeCategoryId = cat.id"
            >
              <component
                :is="categoryIcons[cat.id] || Box"
                class="w-3.5 h-3.5 shrink-0"
                :class="activeCategoryId === cat.id ? 'text-white' : (activeCatalog === 'mvg' ? 'text-amber-500' : 'text-primary')"
              />
              <span>{{ cat.name }}</span>
              <span
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono"
                :class="activeCategoryId === cat.id ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'"
              >
                {{ cat.itemCount }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3. SEARCH & FILTERS BAR (Zero Overleap, Mobile Balanced Grid, Explicit Z-Index) -->
      <section
        class="relative z-30 p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3"
      >
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <!-- Search input -->
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Cari SKU, nama model, pitch, ukuran..."
              class="pl-9 h-11 sm:h-10 text-xs sm:text-sm bg-background/80 border-border/70 focus-visible:ring-primary rounded-xl"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              @click="searchQuery = ''"
            >
              ×
            </button>
          </div>

          <!-- Filter Selects: Responsive grid on mobile, inline on desktop -->
          <div class="grid grid-cols-2 sm:flex sm:w-auto sm:items-center gap-2 w-full">
            <div v-if="availableTypes.length > 0" class="w-full sm:min-w-[150px]">
              <FieldSelect
                v-model="typeFilter"
                :options="typeSelectOptions"
                placeholder="Semua Tipe"
                label="Filter Tipe"
              />
            </div>

            <!-- Filter Gudang ERP (Nasional / Jakarta / Manukan / Bali / dll) -->
            <div class="w-full sm:min-w-[170px]">
              <FieldSelect
                v-model="selectedGudang"
                :options="gudangSelectOptions"
                placeholder="Semua Gudang"
                label="Filter Gudang"
              />
            </div>

            <!-- Filter Status ERP (SYNC ERP / NOT SYNC ERP) -->
            <div class="w-full sm:min-w-[160px]">
              <FieldSelect
                v-model="erpSyncFilter"
                :options="erpSyncSelectOptions"
                placeholder="Status ERP"
                label="Status ERP"
              />
            </div>

            <!-- Urutan Harga -->
            <div class="w-full sm:min-w-[155px] col-span-2 sm:col-span-1">
              <FieldSelect
                v-model="sortBy"
                :options="sortSelectOptions"
                placeholder="Urutan..."
                label="Urutan Harga"
                align="right"
              />
            </div>
          </div>
        </div>

        <!-- Quick ERP Filter Segment Buttons + Summary Strip -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
          <!-- Quick Status ERP Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span class="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider hidden xs:inline-block mr-1">
              Status:
            </span>
            <button
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              :class="erpSyncFilter === 'ALL'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground'"
              @click="erpSyncFilter = 'ALL'"
            >
              <span>Semua</span>
              <span class="text-[10px] opacity-80 font-mono">({{ erpSyncCounts.all }})</span>
            </button>

            <button
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              :class="erpSyncFilter === 'SYNCED'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-xs'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'"
              @click="erpSyncFilter = 'SYNCED'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SYNC ERP</span>
              <span class="text-[10px] font-mono">({{ erpSyncCounts.synced }})</span>
            </button>

            <button
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              :class="erpSyncFilter === 'NOT_SYNCED'
                ? 'bg-rose-600 text-white shadow-rose-500/20 shadow-xs'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'"
              @click="erpSyncFilter = 'NOT_SYNCED'"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>NOT SYNC ERP</span>
              <span class="text-[10px] font-mono">({{ erpSyncCounts.notSynced }})</span>
            </button>
          </div>

          <!-- Right side: Count & Density Switcher & Reset -->
          <div class="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-bold text-foreground truncate">
                {{ activeCategoryId === 'all' ? 'Semua Kategori' : currentCategory?.name }}
              </span>
              <span class="text-muted-foreground/60">•</span>
              <span class="font-mono text-[11px] font-semibold text-foreground">
                {{ filteredItems.length }} item
              </span>
            </div>

            <!-- Mobile Card View Density Switcher (Detailed vs Compact) -->
            <div class="sm:hidden flex items-center p-0.5 rounded-lg border border-border/80 bg-muted/40">
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                :class="mobileCardDensity === 'normal' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'"
                @click="mobileCardDensity = 'normal'"
              >
                Kartu
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                :class="mobileCardDensity === 'compact' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'"
                @click="mobileCardDensity = 'compact'"
              >
                Ringkas
              </button>
            </div>

            <!-- Clear Search/Filter Button -->
            <button
              v-if="searchQuery || typeFilter !== 'ALL' || selectedGudang !== 'ALL' || erpSyncFilter !== 'ALL' || sortBy !== 'default'"
              type="button"
              class="text-[10.5px] font-bold text-rose-500 hover:underline px-2 py-0.5 rounded bg-rose-500/10 cursor-pointer shrink-0"
              @click="searchQuery = ''; typeFilter = 'ALL'; selectedGudang = 'ALL'; erpSyncFilter = 'ALL'; sortBy = 'default'"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <!-- 3B. SPREADSHEET HEADER & KURS $ USD BANNER -->
      <section
        v-if="currentCategory || activeCategoryId === 'all'"
        class="rounded-2xl border border-sky-500/30 overflow-hidden shadow-xs flex flex-col bg-card/60 backdrop-blur-sm"
      >
        <!-- Official Brand Graphic Banner (if available, e.g. Fabulux) -->
        <div
          v-if="currentCategory?.bannerImage"
          class="w-full bg-[#0a2540] border-b border-sky-500/30 flex items-center justify-center p-1 sm:p-2"
        >
          <img
            :src="currentCategory.bannerImage"
            :alt="currentCategory.name"
            class="max-h-16 sm:max-h-20 w-auto object-contain rounded-lg"
          />
        </div>

        <div class="p-2 sm:p-4 bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div class="space-y-0.5 sm:space-y-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
              <h4 class="text-xs sm:text-sm font-black tracking-tight text-foreground uppercase truncate">
                {{ currentCategory?.bannerTitle || currentCategory?.name || (activeCatalog === 'mvg' ? 'PRICELIST MITRA VISUAL GROUP (MVG)' : 'ASIA VISIOTRON (AV) PRICELIST') }}
              </h4>
            </div>
            <p class="text-[10px] sm:text-[11px] text-muted-foreground truncate hidden xs:block">
              {{ currentCategory?.bannerSubtitle || currentCategory?.description || 'Katalog Resmi Mitra Visual Group & Asia Visiotron' }}
            </p>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            <div
              v-if="currentCategory?.kursUSD"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-xs font-semibold text-sky-800 dark:text-sky-200"
            >
              <span class="text-[11px] text-muted-foreground font-normal">
                {{ currentCategory.kursUSD.startsWith('Rp') ? '*KURS $ Hari Ini:' : 'Info:' }}
              </span>
              <span class="font-mono font-bold">{{ currentCategory.kursUSD }}</span>
            </div>

          <Button
            v-if="activeCategoryId === 'mvg_rental_qiangli'"
            variant="outline"
            size="sm"
            class="h-8 text-xs font-semibold gap-1.5 border-sky-500/40 hover:bg-sky-500/10 cursor-pointer"
            @click="isComparisonModalOpen = true"
          >
            <FileText class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Bagan Perbandingan (MAVIC / LITE / SAGA)</span>
          </Button>

          <a
            v-if="activeCategoryId === 'mvg_gaga_laser'"
            href="https://www.youtube.com/watch?v=UkPFF6u30U4"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Demo Showroom (YouTube)</span>
          </a>

          <a
            v-if="activeCategoryId === 'mvg_moka_effect'"
            href="https://www.mokalighting.com/"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Website MOKA Lighting</span>
          </a>
        </div>
      </div>
    </section>

      <!-- 4. LOADING STATE -->
      <div v-if="isLoading" class="py-16 text-center space-y-3">
        <RefreshCw class="w-8 h-8 animate-spin text-primary mx-auto" />
        <p class="text-xs sm:text-sm text-muted-foreground font-medium">
          Memuat data harga Google Sheets...
        </p>
      </div>

      <!-- 5. EMPTY SEARCH STATE -->
      <div
        v-else-if="filteredItems.length === 0"
        class="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 space-y-2"
      >
        <Search class="w-8 h-8 text-muted-foreground/60 mx-auto" />
        <h3 class="font-bold text-sm text-foreground">Tidak Ada Produk Ditemukan</h3>
        <p class="text-xs text-muted-foreground max-w-sm mx-auto">
          Tidak ada produk yang cocok dengan pencarian "{{ searchQuery }}". Silakan reset kata kunci atau filter tipe.
        </p>
        <Button
          variant="outline"
          size="sm"
          class="mt-2 text-xs"
          @click="searchQuery = ''; typeFilter = 'ALL'"
        >
          Reset Filter
        </Button>
      </div>

      <!-- 6. PRODUCT LISTING -->
      <div v-else>
        <!-- A. CARDS GRID VIEW (Always default on Mobile) -->
        <div v-if="isMobileScreen || viewMode === 'cards'">
          <!-- 1. COMPACT LIST VIEW ON MOBILE (Fast Thumb-Scanning Mode) -->
          <div v-if="isMobileScreen && mobileCardDensity === 'compact'" class="space-y-2">
            <div
              v-for="(item, idx) in filteredItems"
              :key="`compact-${item.id}`"
              class="flex items-center gap-3 p-2.5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-colors shadow-2xs active:scale-[0.99] min-h-[64px] cursor-pointer"
              @click="goToDetail(item.id)"
            >
              <!-- Thumbnail 56x56 -->
              <div
                v-if="item.image"
                class="w-14 h-14 shrink-0 min-w-[56px] max-w-[56px] min-h-[56px] max-h-[56px] rounded-xl bg-muted/30 border border-border/70 p-1 flex items-center justify-center cursor-pointer overflow-hidden"
                @click.stop="openImageLightbox(item.image, item.model, item.images)"
              >
                <img :src="item.image" :alt="item.model" class="w-full h-full object-contain pointer-events-none" loading="lazy" />
              </div>

              <!-- Product Details -->
              <div class="flex-1 min-w-0 pr-1">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                    #{{ item.no || idx + 1 }}
                  </span>
                  <span class="text-[9px] font-mono text-muted-foreground truncate max-w-[85px]">
                    {{ item.sku }}
                  </span>
                  <span
                    v-if="item.type"
                    class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary truncate max-w-[90px]"
                  >
                    {{ item.type }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-foreground truncate leading-tight">
                  {{ item.model }}
                </h4>
                <p class="text-[10px] text-muted-foreground truncate">
                  {{ item.size || item.description }}
                </p>
              </div>

              <!-- Price & Link -->
              <div class="text-right shrink-0 min-w-[105px]">
                <div class="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                  {{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}
                </div>
                <div v-if="item.metadata?.hargaKreditFormatted" class="text-[9px] text-muted-foreground font-mono">
                  Krd: {{ item.metadata.hargaKreditFormatted }}
                </div>
                <div v-if="isSuperAdmin && item.metadata?.capitalHpp" class="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                  HPP: Rp {{ Number(item.metadata.capitalHpp).toLocaleString('id-ID') }}
                </div>
                <div v-if="item.isSynced" class="text-[9px] font-mono mt-0.5" :class="getItemAvailableStock(item) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'">
                  Available: {{ getItemAvailableStock(item).toLocaleString('id-ID') }}
                  <span v-if="selectedGudang !== 'ALL'">({{ selectedGudang.replace('Gudang ', '') }})</span>
                </div>
                <div class="flex items-center justify-end gap-1.5 mt-1">
                  <button
                    v-if="item.sellable === true && item.isSynced && getItemAvailableStock(item) > 0"
                    type="button"
                    class="px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    :class="cart.isInCart(item.sku)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'"
                    :title="cart.isInCart(item.sku) ? `Sudah di draf SQ (${cart.getItemQty(item.sku)})` : 'Tambah ke Draf SQ'"
                    @click.stop="handleAddToCart(item)"
                  >
                    <ShoppingCart class="w-3 h-3" />
                    <span>{{ cart.isInCart(item.sku) ? `+(${cart.getItemQty(item.sku)})` : '+ SQ' }}</span>
                  </button>
                  <span
                    v-else-if="item.isSynced && getItemAvailableStock(item) <= 0"
                    class="px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground font-medium"
                  >
                    Habis
                  </span>
                  <a
                    v-if="item.brochureUrl || item.videoUrl"
                    :href="item.brochureUrl || item.videoUrl"
                    target="_blank"
                    rel="noopener"
                    class="inline-block text-[9px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {{ item.videoUrl ? 'Video ▶' : 'Brosur ↗' }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. DETAILED CARD VIEW (Default) -->
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4"
          >
            <div
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              v-motion
            :initial="{ opacity: 0, y: 16, scale: 0.98 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 280,
                damping: 24,
                delay: Math.min(idx * 20, 250)
              }
            }"
            :hovered="{
              y: -3,
              scale: 1.01,
              transition: { type: 'spring', stiffness: 400, damping: 22 }
            }"
            :tapped="{ scale: 0.99 }"
            class="group rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-primary/50 transition-colors duration-150 cursor-pointer"
            :class="{
              'ring-2 ring-emerald-500 bg-emerald-500/5': updatedItemIds.has(item.id)
            }"
            @click="goToDetail(item.id)"
          >
            <!-- Card Header: SKU & Type Badge -->
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-1.5 min-w-0 flex-wrap">
                <div class="flex items-center gap-1.5 min-w-0 flex-wrap flex-1">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors min-w-0 shrink truncate"
                    title="Klik untuk menyalin SKU"
                    @click.stop="copyToClipboard(item.sku)"
                  >
                    <span class="truncate">{{ item.sku }}</span>
                    <Check v-if="copiedSku === item.sku" class="w-3 h-3 text-emerald-500 shrink-0" />
                    <Copy v-else class="w-3 h-3 shrink-0 opacity-60" />
                  </button>

                  <!-- Badge SYNC ERP vs NOT SYNC ERP -->
                  <span
                    v-if="item.isSynced"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 shadow-xs"
                    title="Item ini tersinkronisasi otomatis dengan ERP"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    SYNC ERP
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0 shadow-xs"
                    title="Item ini belum tersinkronisasi di ERP"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    NOT SYNC ERP
                  </span>
                </div>

                <span
                  v-if="item.type"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase shrink-0 max-w-[40%] truncate"
                  :class="[
                    item.type?.toLowerCase().includes('curve')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : item.type?.toLowerCase().includes('indoor')
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : item.type?.toLowerCase().includes('outdoor')
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : item.type?.toLowerCase().includes('electric')
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : item.type?.toLowerCase().includes('head')
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : item.type?.toLowerCase().includes('laser')
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'bg-muted text-muted-foreground'
                  ]"
                >
                  {{ item.type }}
                </span>
              </div>

              <!-- Product Picture (if available) -->
              <div
                v-if="item.image"
                class="relative w-full h-36 rounded-xl overflow-hidden bg-muted/20 border border-border/60 p-2 flex items-center justify-center cursor-pointer group/img hover:border-primary/60 transition-colors"
                :title="item.images && item.images.length > 1 ? `Klik untuk melihat ${item.images.length} foto produk` : 'Klik untuk melihat foto modul/kabinet penuh'"
                @click.stop="openImageLightbox(item.image, item.model, item.images)"
              >
                <img
                  :src="item.image"
                  :alt="item.model"
                  class="max-h-full max-w-full object-contain group-hover/img:scale-105 transition-transform duration-200"
                  loading="lazy"
                />

                <!-- Multi-image badge -->
                <div
                  v-if="item.images && item.images.length > 1"
                  class="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[10px] font-bold flex items-center gap-1 shadow-xs backdrop-blur-xs border border-amber-500/30"
                >
                  <Images class="w-3 h-3" />
                  <span>{{ item.images.length }} Foto</span>
                </div>

                <div class="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1 opacity-80 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs">
                  <ZoomIn class="w-3 h-3" />
                  <span>Lihat Foto</span>
                </div>
              </div>

              <!-- Multi-image thumbnail strip on Card -->
              <div
                v-if="item.images && item.images.length > 1"
                class="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar"
              >
                <button
                  v-for="(subImg, subIdx) in item.images"
                  :key="subIdx"
                  type="button"
                  class="w-8 h-8 rounded-md overflow-hidden border p-0.5 bg-muted/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  :class="item.image === subImg ? 'border-primary ring-1 ring-primary' : 'border-border/60 opacity-60 hover:opacity-100'"
                  :title="`Pilih sudut foto ${subIdx + 1}`"
                  @click.stop="item.image = subImg"
                >
                  <img :src="subImg" :alt="`Thumbnail ${subIdx + 1}`" class="max-h-full max-w-full object-contain" />
                </button>
              </div>

              <!-- Product Name / Title -->
              <div>
                <h3 class="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {{ item.model || item.description }}
                </h3>
                <p v-if="item.description && item.description !== item.model" class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {{ item.description }}
                </p>
                <a
                  v-if="item.brochureUrl"
                  :href="item.brochureUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline pt-1"
                  :class="[
                    item.brochureUrl.includes('youtube') || item.brochureUrl.includes('youtu.be')
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-sky-600 dark:text-sky-400'
                  ]"
                >
                  <ExternalLink class="w-3 h-3" />
                  <span>
                    {{
                      item.brochureUrl.includes('youtube') || item.brochureUrl.includes('youtu.be')
                        ? 'Lihat Video Demonstrasi (YouTube) ↗'
                        : item.brochureUrl.includes('drive.google.com') || item.brochureUrl.toLowerCase().includes('.pdf')
                        ? 'Buka Brosur Resmi (Drive PDF) ↗'
                        : 'Buka Tautan Resmi ↗'
                    }}
                  </span>
                </a>
                <p v-if="item.metadata?.specification && item.metadata?.specification !== item.description" class="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-tight font-mono">
                  {{ item.metadata.specification }}
                </p>
              </div>

              <!-- Specs Pills (Size, Curve, Kredit, Weight) -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span
                  v-if="item.size"
                  class="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-mono text-foreground font-medium"
                >
                  {{ item.size }}
                </span>
                <span
                  v-if="item.metadata?.curve && item.metadata?.curve !== '-'"
                  class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold"
                >
                  {{ item.metadata.curve }}
                </span>

                <span
                  v-if="item.metadata?.capacity"
                  class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
                >
                  Cap: {{ item.metadata.capacity }}
                </span>
                <span
                  v-if="item.metadata?.weight"
                  class="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px]"
                >
                  {{ item.metadata.weight }}
                </span>
                <span
                  v-if="item.refreshRate"
                  class="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground"
                >
                  {{ item.refreshRate }}Hz
                </span>
                <span
                  v-if="item.metadata?.tkdnValue"
                  class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold"
                >
                  TKDN {{ item.metadata.tkdnValue }}
                </span>
              </div>

              <!-- Special Breakdown: Novastar Capital / HPP & Profit (Super Admin Only) -->
              <div v-if="isSuperAdmin && item.metadata?.capitalHpp" class="pt-2 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p class="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Capital / HPP
                    </p>
                    <p class="font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5 text-xs">Rp {{ Number(item.metadata.capitalHpp).toLocaleString('id-ID') }}</p>
                  </div>
                  <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Cash Price {{ item.metadata?.profitPercent ? `(${item.metadata.profitPercent})` : '' }}
                    </p>
                    <p class="font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 text-xs">{{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}</p>
                  </div>
                </div>
              </div>

              <!-- Special Breakdown: Instalasi LED Dual Prices (Modular vs Cabinet) -->
              <div v-if="item.category === 'mvg_instalasi_led'" class="pt-2 space-y-2 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    <p class="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Harga Modular
                    </p>
                    <p class="font-bold text-foreground font-mono mt-0.5 text-xs">{{ item.metadata?.hargaModularFormatted || '-' }}</p>
                  </div>
                  <div class="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <p class="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      Harga Cabinet
                    </p>
                    <p class="font-bold text-foreground font-mono mt-0.5 text-xs">{{ item.metadata?.hargaCabinetFormatted || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Special Breakdown: LED Poster Dual Prices & Full BOM -->
              <div v-if="item.category === 'led_poster'" class="pt-2 space-y-2 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                    <p class="text-[10px] text-muted-foreground font-medium">Cabinet Flat</p>
                    <p class="font-bold text-foreground font-mono">{{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}</p>
                  </div>
                  <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                    <p class="text-[10px] text-muted-foreground font-medium">Foldable</p>
                    <p class="font-bold text-foreground font-mono">{{ item.metadata?.foldablePriceFormatted || '-' }}</p>
                  </div>
                </div>

                <!-- Quick BOM Chips -->
                <div class="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  <span class="px-1.5 py-0.5 rounded bg-muted/60 font-mono">24 Modul</span>
                  <span class="px-1.5 py-0.5 rounded bg-muted/60 font-mono">{{ item.metadata?.psuPcs || 4 }} PSU</span>
                  <span class="px-1.5 py-0.5 rounded bg-muted/60 font-mono">{{ item.metadata?.rcPcs || 2 }} RC</span>
                  <span class="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">A35 Player</span>
                  <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">Margin 25%</span>
                </div>

                <button
                  type="button"
                  class="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline pt-0.5"
                  @click.stop="togglePosterExpand(item.id)"
                >
                  <Layers class="w-3.5 h-3.5" />
                  <span>{{ expandedPosterId === item.id ? 'Sembunyikan Rincian BOM' : 'Lihat Rincian BOM / Costing' }}</span>
                  <ChevronDown class="w-3 h-3 transition-transform" :class="{ 'rotate-180': expandedPosterId === item.id }" />
                </button>

                <div
                  v-if="expandedPosterId === item.id"
                  class="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] space-y-1.5 text-muted-foreground font-mono animate-in fade-in duration-200"
                  @click.stop
                >
                  <div class="flex justify-between items-center pb-1 border-b border-border/40">
                    <span class="font-sans font-semibold text-foreground">Komponen Spek</span>
                    <span class="font-sans font-semibold text-foreground">Biaya / Jumlah</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Modul ({{ item.metadata?.modulePcs || 24 }} pcs):</span>
                    <span class="font-semibold text-foreground">Rp {{ (item.metadata?.moduleTotalPrice || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Kabinet Flat:</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.cabinetFlatCost || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Kabinet Foldable:</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.cabinetFoldableCost || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Power Supply ({{ item.metadata?.psuPcs || 4 }} pcs):</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.psuTotalPrice || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Receiving Card ({{ item.metadata?.rcPcs || 2 }} pcs):</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.rcTotalPrice || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Kabel (Jumper + Power):</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.cablesTotal || 350000).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Assembly Cost:</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.assemblyCost || 270000).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-sans">Processor A35:</span>
                    <span class="text-foreground">Rp {{ (item.metadata?.processorA35Cost || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between items-center pt-1 border-t border-border/40">
                    <span class="font-sans font-bold text-foreground">Profit Margin:</span>
                    <span class="font-bold text-amber-500">{{ item.metadata?.profitMargin || '25.00%' }}</span>
                  </div>
                  <div class="flex justify-between items-center" v-if="item.metadata?.baseCost">
                    <span class="font-sans font-bold text-foreground">HPP Modal:</span>
                    <span class="font-bold text-foreground">Rp {{ Number(item.metadata.baseCost).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>

              <!-- Special Breakdown: LED Cube Dual Prices -->
              <div v-if="item.category === 'led_cube'" class="pt-2 space-y-1.5 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                    <p class="text-[10px] text-muted-foreground">Cube 4 Sisi</p>
                    <p class="font-bold text-foreground">{{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}</p>
                  </div>
                  <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                    <p class="text-[10px] text-muted-foreground">Cube 5 Sisi</p>
                    <p class="font-bold text-foreground">{{ item.metadata?.price5SideFormatted || '-' }}</p>
                  </div>
                </div>

                <button
                  type="button"
                  class="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline pt-0.5"
                  @click="toggleCubeExpand(item.id)"
                >
                  <span>{{ expandedCubeId === item.id ? 'Tutup Rincian' : 'Lihat Rincian Komponen' }}</span>
                  <ChevronDown class="w-3 h-3 transition-transform" :class="{ 'rotate-180': expandedCubeId === item.id }" />
                </button>

                <div
                  v-if="expandedCubeId === item.id"
                  class="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] space-y-1 text-muted-foreground animate-in fade-in duration-200"
                >
                  <div class="flex justify-between">
                    <span>Modul Unit:</span>
                    <span class="font-medium text-foreground">Rp {{ (item.metadata?.modulePriceIdr || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Cabinet Iron:</span>
                    <span class="font-medium text-foreground">Rp {{ (item.metadata?.cabinet4Side || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Power Supply:</span>
                    <span class="font-medium text-foreground">Rp {{ (item.metadata?.psuCost || 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Processor A35:</span>
                    <span class="font-medium text-foreground">Rp {{ (item.metadata?.processorCost || 0).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Bottom: Stock, Price, & Action Buttons (Separated into clean vertical tiers to prevent overlap) -->
            <div class="pt-2.5 mt-3 border-t border-border/60 space-y-2.5">
              <!-- Available Stock (Khusus Item yang sudah Sync ERP) -->
              <div
                v-if="item.isSynced"
                class="flex items-center justify-between text-[11px] pb-1.5 border-b border-border/40"
              >
                <span class="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Package class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Available Stock</span>
                </span>
                <div class="text-right">
                  <span
                    class="font-mono font-bold px-2 py-0.5 rounded text-[11px]"
                    :class="getItemAvailableStock(item) > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground'"
                  >
                    {{ getItemAvailableStock(item).toLocaleString('id-ID') }} Unit
                  </span>
                  <span v-if="selectedGudang !== 'ALL'" class="block text-[9px] text-muted-foreground font-mono mt-0.5">
                    {{ selectedGudang }}
                  </span>
                </div>
              </div>

              <!-- Price Section (Full width, zero overlap) -->
              <div class="space-y-0.5">
                <p class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                  {{
                    item.category.includes('rental')
                      ? 'Harga Cash (Termurah)'
                      : item.category === 'led_poster'
                      ? 'Harga Flat'
                      : item.category === 'led_cube'
                      ? 'Harga 4 Sisi'
                      : item.category === 'mvg_instalasi_led'
                      ? 'Harga Cabinet (Paket)'
                      : 'Harga Satuan'
                  }}
                </p>
                <div class="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    class="text-base sm:text-lg font-black tracking-tight"
                    :class="item.category.includes('rental') ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-foreground'"
                  >
                    {{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}
                  </span>
                  <span
                    v-if="item.previousPrice && item.previousPrice !== item.price"
                    class="text-[10px] text-muted-foreground line-through whitespace-nowrap"
                  >
                    Rp {{ item.previousPrice.toLocaleString('id-ID') }}
                  </span>
                </div>
                <p v-if="item.metadata?.hargaKreditFormatted" class="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Kredit: <span class="font-mono text-foreground font-semibold">{{ item.metadata.hargaKreditFormatted }}</span>
                </p>
                <div v-if="isSuperAdmin && item.metadata?.capitalHpp" class="pt-1 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  <span class="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">HPP:</span>
                  <span class="font-bold">Rp {{ Number(item.metadata.capitalHpp).toLocaleString('id-ID') }}</span>
                  <span v-if="item.metadata?.profitPercent" class="text-[10px] text-blue-600 dark:text-blue-400 font-semibold ml-1">({{ item.metadata.profitPercent }})</span>
                </div>
              </div>

              <!-- Action Buttons Row: Add to Cart (flex-1) + Quick Detail Action -->
              <div class="grid grid-cols-12 gap-1.5 pt-1">
                <!-- Add to Cart -->
                <button
                  v-if="item.sellable === true && item.isSynced && getItemAvailableStock(item) > 0"
                  type="button"
                  class="col-span-8 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  :class="cart.isInCart(item.sku)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'"
                  :title="cart.isInCart(item.sku) ? `Sudah di keranjang (${cart.getItemQty(item.sku)} unit). Klik untuk pilih batch lagi.` : 'Pilih batch dan masukkan ke keranjang SQ'"
                  @click.stop="handleAddToCart(item)"
                >
                  <ShoppingCart class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">{{ cart.isInCart(item.sku) ? `+ (${cart.getItemQty(item.sku)}) Keranjang` : '+ Keranjang' }}</span>
                </button>

                <button
                  v-else-if="item.isSynced && getItemAvailableStock(item) <= 0"
                  type="button"
                  disabled
                  class="col-span-8 py-2 px-2.5 rounded-xl bg-muted/60 text-[10.5px] font-semibold text-muted-foreground/60 cursor-not-allowed border border-border/50 flex items-center justify-center"
                  :title="selectedGudang !== 'ALL' ? `Stok kosong di ${selectedGudang}` : 'Stok item ini sedang kosong di semua gudang'"
                  @click.stop
                >
                  Stok Habis
                </button>

                <button
                  v-else
                  type="button"
                  disabled
                  class="col-span-8 py-2 px-2.5 rounded-xl bg-muted/60 text-[10.5px] font-semibold text-muted-foreground/60 cursor-not-allowed border border-border/50 flex items-center justify-center"
                  title="Item ini belum disinkronkan dengan ERP"
                  @click.stop
                >
                  Belum Sync
                </button>

                <!-- Quick Detail Action -->
                <button
                  type="button"
                  class="col-span-4 py-2 px-2 rounded-xl bg-muted/70 hover:bg-primary hover:text-primary-foreground text-xs font-semibold text-muted-foreground transition-all flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs cursor-pointer"
                  title="Lihat Detail Lengkap Produk"
                  @click.stop="goToDetail(item.id)"
                >
                  <span>Detail</span>
                  <ChevronRight class="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- B1. SPECIALIZED FULL BOM COSTING SPREADSHEET FOR LED POSTER (Matches Google Sheets gid=773747421) -->
        <div v-else-if="!isMobileScreen && viewMode === 'table' && activeCategoryId === 'led_poster'" class="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <!-- Banner Information Bar -->
          <div class="px-4 py-2.5 bg-muted/40 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-bold text-foreground">Format Spreadsheet BOM &amp; Costing Lengkap (Google Sheets GID: 773747421)</span>
              <span class="text-muted-foreground">• 19 Parameter Komponen Resmi</span>
            </div>
            <div class="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
              <span>↔ Geser horizontal untuk meninjau seluruh komponen, biaya rakit &amp; harga jadi</span>
            </div>
          </div>

          <div class="overflow-x-auto custom-scrollbar">
            <Table class="border-collapse text-[11px] min-w-[1700px]">
              <TableHeader class="bg-muted/80 text-foreground font-bold sticky top-0 z-20">
                <!-- Row 1: Group Headers -->
                <TableRow class="border-b border-border/80 hover:bg-transparent">
                  <TableHead rowspan="2" class="w-[45px] text-center border-r border-border/60 sticky left-0 bg-background dark:bg-zinc-900 z-30 opacity-100">NO</TableHead>
                  <TableHead rowspan="2" class="w-[60px] text-center border-r border-border/60 sticky left-[45px] bg-background dark:bg-zinc-900 z-30 opacity-100">PICTURE</TableHead>
                  <TableHead rowspan="2" class="min-w-[180px] border-r-2 border-border sticky left-[105px] bg-background dark:bg-zinc-900 z-30 opacity-100 shadow-[4px_0_8px_rgba(0,0,0,0.12)]">TYPE / MODEL</TableHead>
                  <TableHead colspan="2" class="text-center border-r border-border/60 bg-primary/10 text-primary">MODULE</TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[115px]">CABINET IRON<br><span class="text-[10px] text-muted-foreground font-normal">Flat 64*192cm</span></TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[115px]">CABINET IRON<br><span class="text-[10px] text-muted-foreground font-normal">Foldable 64*192cm</span></TableHead>
                  <TableHead colspan="2" class="text-center border-r border-border/60 bg-blue-500/10 text-blue-600 dark:text-blue-400">POWER SUPPLY</TableHead>
                  <TableHead colspan="2" class="text-center border-r border-border/60 bg-purple-500/10 text-purple-600 dark:text-purple-400">RC (RECEIVING CARD)</TableHead>
                  <TableHead colspan="2" class="text-center border-r border-border/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">CABLES</TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[95px]">ASSEMBLY COST</TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[115px]">PROCESSOR<br><span class="text-[10px] text-muted-foreground font-normal">A35 Colorlight</span></TableHead>
                  <TableHead rowspan="2" class="text-center border-r border-border/60 min-w-[65px]">PROFIT</TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[130px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold">PRICE FLAT<br><span class="text-[10px] font-normal">With A35 Player</span></TableHead>
                  <TableHead rowspan="2" class="text-right border-r border-border/60 min-w-[130px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold">PRICE FOLDABLE<br><span class="text-[10px] font-normal">With A35 Player</span></TableHead>
                  <TableHead rowspan="2" class="text-center border-r border-border/60 min-w-[75px]">SIZE</TableHead>
                  <TableHead rowspan="2" class="border-r border-border/60 min-w-[150px] font-mono">SKU</TableHead>
                  <TableHead rowspan="2" class="text-right min-w-[105px] font-mono">BASE COST</TableHead>
                </TableRow>
                <!-- Row 2: Sub Headers -->
                <TableRow class="border-b border-border/80 hover:bg-transparent text-[10px]">
                  <TableHead class="text-right border-r border-border/60 min-w-[90px] bg-primary/5">PRICE</TableHead>
                  <TableHead class="text-center border-r border-border/60 min-w-[40px] bg-primary/5">PCS</TableHead>
                  <TableHead class="text-center border-r border-border/60 min-w-[40px] bg-blue-500/5">PCS</TableHead>
                  <TableHead class="text-right border-r border-border/60 min-w-[85px] bg-blue-500/5">PRICE</TableHead>
                  <TableHead class="text-center border-r border-border/60 min-w-[40px] bg-purple-500/5">PCS</TableHead>
                  <TableHead class="text-right border-r border-border/60 min-w-[85px] bg-purple-500/5">PRICE</TableHead>
                  <TableHead class="text-right border-r border-border/60 min-w-[80px] bg-emerald-500/5">JUMPER</TableHead>
                  <TableHead class="text-right border-r border-border/60 min-w-[80px] bg-emerald-500/5">POWER</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow
                  v-for="(item, idx) in filteredItems"
                  :key="item.id"
                  class="transition-colors hover:bg-muted/40 cursor-pointer font-mono text-[11px] divide-x divide-border/60"
                  @click="goToDetail(item.id)"
                >
                  <TableCell class="text-center text-muted-foreground sticky left-0 bg-background dark:bg-zinc-900 z-10 opacity-100">{{ item.no || idx + 1 }}</TableCell>
                  <TableCell class="text-center p-1 sticky left-[45px] bg-background dark:bg-zinc-900 z-10 opacity-100" @click.stop="openImageLightbox(item.image, item.model, item.images)">
                    <img :src="item.image" :alt="item.model" class="w-7 h-7 object-contain mx-auto rounded border border-border/60 bg-muted/20" />
                  </TableCell>
                  <TableCell class="font-sans font-bold text-foreground sticky left-[105px] bg-background dark:bg-zinc-900 z-10 opacity-100 shadow-[4px_0_8px_rgba(0,0,0,0.12)] border-r-2 border-border truncate max-w-[200px]">{{ item.model }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.moduleUnitPrice || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-center font-bold">{{ item.metadata?.modulePcs || 24 }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.cabinetFlatCost || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.cabinetFoldableCost || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-center font-bold">{{ item.metadata?.psuPcs || 4 }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.psuUnitPrice || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-center font-bold">{{ item.metadata?.rcPcs || 2 }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.rcUnitPrice || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.cablesJumper || 200000).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.cablesPower || 150000).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.assemblyCost || 270000).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-right">Rp {{ (item.metadata?.processorA35Cost || 0).toLocaleString('id-ID') }}</TableCell>
                  <TableCell class="text-center font-bold text-amber-500">{{ item.metadata?.profitMargin || '25.00%' }}</TableCell>
                  <TableCell class="text-right font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/5">{{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}</TableCell>
                  <TableCell class="text-right font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/5">{{ item.metadata?.foldablePriceFormatted || '-' }}</TableCell>
                  <TableCell class="text-center font-sans text-muted-foreground">{{ item.size || '64x192Cm' }}</TableCell>
                  <TableCell class="text-[10px] text-muted-foreground">{{ item.sku }}</TableCell>
                  <TableCell class="text-right text-muted-foreground">{{ item.metadata?.baseCost ? 'Rp ' + Number(item.metadata.baseCost).toLocaleString('id-ID') : '-' }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- B2. STANDARD DESKTOP SPREADSHEET TABLE VIEW (All Other Categories) -->
        <div v-else-if="!isMobileScreen && viewMode === 'table'" class="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div class="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader class="bg-muted/40">
                <TableRow class="hover:bg-transparent">
                  <TableHead class="w-[50px] text-xs font-semibold">No</TableHead>
                  <TableHead class="w-[75px] text-center text-xs font-semibold">Picture</TableHead>
                  <TableHead class="w-[150px] text-xs font-semibold">SKU</TableHead>
                  <TableHead class="min-w-[200px] text-xs font-semibold">Model & Deskripsi</TableHead>
                  <TableHead class="w-[120px] text-xs font-semibold">Tipe</TableHead>
                  <TableHead class="w-[110px] text-xs font-semibold">Ukuran / Spek</TableHead>

                  <TableHead v-if="activeCategoryId === 'mvg_instalasi_led'" class="w-[140px] text-xs font-semibold">
                    Harga Modular
                  </TableHead>
                  <TableHead v-if="activeCategoryId === 'led_poster'" class="w-[150px] text-xs font-semibold">
                    Foldable
                  </TableHead>
                  <TableHead v-if="activeCategoryId === 'led_cube'" class="w-[150px] text-xs font-semibold">
                    Cube 5 Sisi
                  </TableHead>
                  <TableHead v-if="activeCategoryId.includes('rental')" class="w-[140px] text-xs font-semibold">
                    Harga Kredit
                  </TableHead>
                  <TableHead v-if="activeCategoryId === 'magnustek_tkdn'" class="w-[130px] text-xs font-semibold">
                    Nilai TKDN
                  </TableHead>
                  <TableHead v-if="isSuperAdmin && activeCategoryId === 'novastar'" class="w-[140px] text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Capital / HPP
                  </TableHead>
                  <TableHead v-if="isSuperAdmin && activeCategoryId === 'novastar'" class="w-[90px] text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Margin
                  </TableHead>

                  <TableHead class="w-[150px] text-right text-xs font-semibold">
                    {{
                      activeCategoryId === 'mvg_instalasi_led'
                        ? 'Harga Cabinet'
                        : activeCategoryId.includes('rental')
                        ? 'Harga Cash'
                        : activeCategoryId === 'led_poster'
                        ? 'Harga Flat'
                        : activeCategoryId === 'led_cube'
                        ? 'Cube 4 Sisi'
                        : 'Harga Satuan'
                    }}
                  </TableHead>
                  <TableHead v-if="hasLinkColumn" class="w-[105px] text-center text-xs font-semibold">
                    Brosur / Link
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow
                  v-for="(item, idx) in filteredItems"
                  :key="item.id"
                  class="transition-colors duration-150 group cursor-pointer hover:bg-muted/40"
                  :class="{
                    'bg-emerald-500/10 dark:bg-emerald-500/20 font-medium': updatedItemIds.has(item.id)
                  }"
                  @click="goToDetail(item.id)"
                >
                  <TableCell class="text-xs text-muted-foreground font-mono">
                    {{ item.no || idx + 1 }}
                  </TableCell>

                  <!-- Picture Thumbnail -->
                  <TableCell class="text-center">
                    <div
                      v-if="item.image"
                      class="relative w-12 h-12 mx-auto rounded-lg overflow-hidden bg-muted/30 border border-border/70 p-1 flex items-center justify-center cursor-pointer hover:border-primary transition-colors group/timg"
                      :title="item.images && item.images.length > 1 ? `Klik untuk melihat ${item.images.length} foto produk` : 'Klik untuk memperbesar foto kabinet'"
                      @click="openImageLightbox(item.image, item.model, item.images)"
                    >
                      <img :src="item.image" :alt="item.model" class="max-h-full max-w-full object-contain group-hover/timg:scale-110 transition-transform duration-150" loading="lazy" />
                      <span
                        v-if="item.images && item.images.length > 1"
                        class="absolute bottom-0 right-0 bg-black/85 text-amber-400 text-[8px] font-bold px-1 rounded-tl border-t border-l border-amber-500/30"
                      >
                        {{ item.images.length }}
                      </span>
                    </div>
                    <span v-else class="text-[11px] text-muted-foreground">-</span>
                  </TableCell>

                  <TableCell>
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <Badge variant="secondary" class="font-mono text-[11px] font-normal px-2 py-0.5 max-w-[140px] truncate">
                          {{ item.sku }}
                        </Badge>
                        <button
                          type="button"
                          class="text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                          title="Salin SKU"
                          @click="copyToClipboard(item.sku)"
                        >
                          <Check v-if="copiedSku === item.sku" class="w-3.5 h-3.5 text-emerald-500" />
                          <Copy v-else class="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div class="flex items-center gap-1 flex-wrap">
                        <span
                          v-if="item.isSynced"
                          class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          SYNC ERP
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          NOT SYNC ERP
                        </span>

                        <span
                          v-if="item.isSynced"
                          class="font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded"
                          :class="getItemAvailableStock(item) > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground bg-muted'"
                        >
                          Available: {{ getItemAvailableStock(item).toLocaleString('id-ID') }}
                          <span v-if="selectedGudang !== 'ALL'">({{ selectedGudang.replace('Gudang ', '') }})</span>
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div class="space-y-0.5">
                      <div class="text-xs font-semibold text-foreground">
                        {{ item.model || item.description }}
                      </div>
                      <div v-if="item.description && item.description !== item.model" class="text-[11px] text-muted-foreground">
                        {{ item.description }}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      class="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      :class="[
                        item.type?.toLowerCase().includes('curve')
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : item.type?.toLowerCase().includes('indoor')
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : item.type?.toLowerCase().includes('outdoor')
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      ]"
                    >
                      {{ item.type || '-' }}
                    </span>
                  </TableCell>

                  <TableCell class="text-xs text-muted-foreground">
                    <div class="space-y-0.5">
                      <div v-if="item.size" class="font-mono text-[11px] text-foreground font-medium">
                        {{ item.size }}
                      </div>
                      <div v-if="item.metadata?.capacity" class="text-[10px] text-emerald-600 font-semibold">
                        Cap: {{ item.metadata.capacity }}
                      </div>
                      <div v-if="item.refreshRate" class="text-[10px] text-muted-foreground">
                        {{ item.refreshRate }}Hz
                      </div>
                    </div>
                  </TableCell>

                  <TableCell v-if="activeCategoryId === 'mvg_instalasi_led'" class="text-xs font-mono font-semibold text-primary">
                    {{ item.metadata?.hargaModularFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId === 'led_poster'" class="text-xs font-medium">
                    {{ item.metadata?.foldablePriceFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId === 'led_cube'" class="text-xs font-medium">
                    {{ item.metadata?.price5SideFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId.includes('rental')" class="text-xs font-medium text-foreground font-mono">
                    {{ item.metadata?.hargaKreditFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId === 'magnustek_tkdn'">
                    <Badge variant="outline" class="font-mono text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      {{ item.metadata?.tkdnValue || '-' }}
                    </Badge>
                  </TableCell>
                  <TableCell v-if="isSuperAdmin && activeCategoryId === 'novastar'" class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {{ item.metadata?.capitalHpp ? 'Rp ' + Number(item.metadata.capitalHpp).toLocaleString('id-ID') : '-' }}
                  </TableCell>
                  <TableCell v-if="isSuperAdmin && activeCategoryId === 'novastar'" class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {{ item.metadata?.profitPercent || '-' }}
                  </TableCell>

                  <!-- Harga Cash / Satuan (Bold Bright Red) -->
                  <TableCell class="text-right">
                    <div class="space-y-0.5">
                      <div class="text-xs sm:text-sm font-black tracking-tight text-rose-600 dark:text-rose-400 font-extrabold">
                        {{ item.sellable === true ? item.priceFormatted : 'Menunggu review Hermes' }}
                      </div>
                      <div
                        v-if="item.previousPrice && item.previousPrice !== item.price"
                        class="text-[10px] text-muted-foreground line-through font-mono"
                      >
                        Rp {{ item.previousPrice.toLocaleString('id-ID') }}
                      </div>
                    </div>
                  </TableCell>

                  <!-- Brosur / Video / Detail Link -->
                  <TableCell v-if="hasLinkColumn" class="text-center">
                    <a
                      v-if="item.brochureUrl"
                      :href="item.brochureUrl"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors"
                      :class="[
                        item.brochureUrl.includes('youtube') || item.brochureUrl.includes('youtu.be')
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : item.brochureUrl.includes('drive.google.com') || item.brochureUrl.toLowerCase().includes('.pdf')
                          ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      ]"
                      :title="item.brochureUrl"
                    >
                      <span>{{ item.brochureUrl.includes('youtube') || item.brochureUrl.includes('youtu.be') ? 'Video' : item.brochureUrl.includes('drive.google.com') || item.brochureUrl.toLowerCase().includes('.pdf') ? 'PDF' : 'Link' }}</span>
                      <ExternalLink class="w-3 h-3" />
                    </a>
                    <span v-else class="text-[11px] text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- SPREADSHEET FOOTER NOTES -->
        <div
          v-if="currentCategory?.notes && currentCategory.notes.length > 0"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 mt-4 text-xs"
        >
          <div class="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
            <FileText class="w-4 h-4" />
            <span>Catatan Penting (Note):</span>
          </div>
          <ul class="space-y-1.5 text-muted-foreground text-xs pl-1">
            <li v-for="(note, nIdx) in currentCategory.notes" :key="nIdx" class="flex items-start gap-2">
              <span class="text-amber-600 font-bold">•</span>
              <span>{{ note }}</span>
            </li>
          </ul>
        </div>

        <!-- QIANGLI SPECIFICATION COMPARISON MATRIX (MAVIC vs LITE vs SAGA) -->
        <div
          v-if="activeCategoryId === 'mvg_rental_qiangli'"
          class="mt-6 rounded-2xl border border-sky-500/30 bg-card p-4 sm:p-5 space-y-4 shadow-sm"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="font-bold border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/10 uppercase">
                  QiangLi Rental Series
                </Badge>
                <h3 class="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">
                  Tabel Perbandingan Spesifikasi
                </h3>
              </div>
              <p class="text-xs text-muted-foreground">
                Perbandingan komprehensif kabinet MAVIC vs LITE vs SAGA sesuai bagan resmi pabrik.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs font-semibold gap-1.5 border-sky-500/40 hover:bg-sky-500/10 cursor-pointer self-start sm:self-auto"
              @click="isComparisonChartOpen = true"
            >
              <ZoomIn class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Buka Gambar Bagan Asli ↗</span>
            </Button>
          </div>

          <!-- Interactive Comparison Table -->
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="border-b border-border/80">
                  <th class="p-2.5 font-bold text-muted-foreground w-[180px]">Parameter</th>
                  <th class="p-2.5 font-bold text-center w-[220px]">
                    <div class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-teal-600 text-white font-serif font-bold text-xs tracking-wider shadow-xs">
                      MAVIC
                    </div>
                  </th>
                  <th class="p-2.5 font-bold text-center w-[220px]">
                    <div class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-lime-600 text-white font-serif font-bold text-xs tracking-wider shadow-xs">
                      LITE
                    </div>
                  </th>
                  <th class="p-2.5 font-bold text-center w-[220px]">
                    <div class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-rose-600 text-white font-serif font-bold text-xs tracking-wider shadow-xs">
                      SAGA
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/50">
                <tr v-for="(spec, sIdx) in qiangliSpecs" :key="sIdx" class="hover:bg-muted/30 transition-colors">
                  <td class="p-2.5 font-semibold text-muted-foreground">
                    <span class="inline-block px-2.5 py-1 rounded-md bg-muted/60 text-foreground font-medium">
                      {{ spec.parameter }}
                    </span>
                  </td>
                  <td class="p-2.5 text-center font-medium whitespace-pre-line text-foreground">
                    {{ spec.mavic }}
                  </td>
                  <td class="p-2.5 text-center font-medium whitespace-pre-line text-foreground">
                    {{ spec.lite }}
                  </td>
                  <td class="p-2.5 text-center font-medium whitespace-pre-line text-foreground">
                    {{ spec.saga }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- 7. IMAGE LIGHTBOX MODAL DIALOG -->
    <div
      v-if="isLightboxOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      @click="closeImageLightbox"
    >
      <div
        class="relative max-w-2xl w-full bg-card rounded-2xl border border-border shadow-2xl p-4 sm:p-6 space-y-3"
        @click.stop
      >
        <div class="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <h3 class="font-bold text-sm sm:text-base text-foreground truncate">
            {{ lightboxTitle }}
          </h3>
          <button
            type="button"
            class="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            @click="closeImageLightbox"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/20 p-2">
          <img
            v-if="lightboxImage"
            :src="lightboxImage"
            :alt="lightboxTitle || ''"
            class="max-h-[60vh] max-w-full object-contain rounded-lg"
          />
        </div>

        <!-- Multi-image gallery thumbnails -->
        <div
          v-if="lightboxGallery.length > 1"
          class="flex items-center justify-center gap-2 pt-1 pb-1 overflow-x-auto no-scrollbar"
        >
          <button
            v-for="(gImg, gIdx) in lightboxGallery"
            :key="gIdx"
            type="button"
            class="w-14 h-14 rounded-lg overflow-hidden border-2 p-1 bg-black/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
            :class="lightboxImage === gImg ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 opacity-60 hover:opacity-100'"
            :title="`Lihat foto ${gIdx + 1}`"
            @click="lightboxImage = gImg"
          >
            <img :src="gImg" :alt="`Foto ${gIdx + 1}`" class="max-h-full max-w-full object-contain" />
          </button>
        </div>

        <div class="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span v-if="lightboxGallery.length > 1">
            Menampilkan foto {{ lightboxGallery.indexOf(lightboxImage || '') + 1 }} dari {{ lightboxGallery.length }}
          </span>
          <span v-else>Foto Produk Resmi</span>
          <Button variant="outline" size="sm" class="h-8 text-xs cursor-pointer" @click="closeImageLightbox">
            Tutup
          </Button>
        </div>
      </div>
    </div>

    <!-- 8. OFFICIAL COMPARISON CHART MODAL DIALOG -->
    <div
      v-if="isComparisonChartOpen || isComparisonModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      @click="isComparisonChartOpen = false; isComparisonModalOpen = false"
    >
      <div
        class="relative max-w-4xl w-full bg-card rounded-2xl border border-border shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92vh] flex flex-col"
        @click.stop
      >
        <div class="flex items-center justify-between gap-3 border-b border-border/60 pb-3 shrink-0">
          <div>
            <h3 class="font-bold text-sm sm:text-base text-foreground">
              Bagan Spesifikasi Resmi QiangLi Rental Series
            </h3>
            <p class="text-xs text-muted-foreground">
              Perbandingan MAVIC vs LITE vs SAGA (Mitra Visual Group)
            </p>
          </div>
          <button
            type="button"
            class="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            @click="isComparisonChartOpen = false; isComparisonModalOpen = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-auto rounded-xl bg-slate-950 p-2 flex items-center justify-center">
          <img
            src="/images/products/qiangli-comparison-chart.png"
            alt="QiangLi Rental Series Comparison Chart"
            class="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        </div>

        <div class="flex items-center justify-between text-xs text-muted-foreground pt-1 shrink-0">
          <span>Dokumen Bagan Resmi QiangLi Rental Series</span>
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs cursor-pointer"
            @click="isComparisonChartOpen = false; isComparisonModalOpen = false"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>

    <!-- Mobile-Friendly Footer -->
    <footer class="mt-auto border-t border-border/80 bg-background/60 py-4 text-center text-[11px] text-muted-foreground px-4">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="font-medium">© 2026 Mitra Visual Group (MVG) & Asia Visiotron. All rights reserved.</p>
        <div class="flex items-center gap-2">
          <span>Sinkronisasi Data Otomatis</span>
          <span>•</span>
          <span class="font-mono">Live 60s SSE</span>
        </div>
      </div>
    </footer>

    <!-- MOBILE CATEGORY SELECTION BOTTOM SHEET DRAWER -->
    <Teleport to="body">
      <div v-if="isCategorySheetOpen" class="fixed inset-0 z-[998] flex flex-col justify-end">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          @click="isCategorySheetOpen = false"
        />

        <!-- Slide-up Bottom Sheet Drawer -->
        <div
          class="relative z-[999] w-full max-h-[85vh] bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col p-4 animate-in slide-in-from-bottom duration-250 ease-out"
        >
          <!-- Pull bar handle -->
          <div class="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />

          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div>
              <h4 class="text-sm font-bold text-foreground">
                Pilih Kategori {{ activeCatalog === 'mvg' ? 'MVG' : 'AV' }}
              </h4>
              <p class="text-[11px] text-muted-foreground">
                {{ currentCatalogCategories.length }} Kategori • {{ totalCatalogItems }} Total Produk
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              @click="isCategorySheetOpen = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Category Options List -->
          <div class="overflow-y-auto no-scrollbar py-3 space-y-2 flex-1 overscroll-contain">
            <!-- 1. "Semua Kategori" Row -->
            <button
              type="button"
              class="w-full min-h-[50px] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm transition-all border cursor-pointer active:scale-[0.99]"
              :class="[
                activeCategoryId === 'all'
                  ? 'bg-primary text-primary-foreground font-bold border-primary shadow-sm'
                  : 'bg-muted/30 hover:bg-muted text-foreground border-transparent'
              ]"
              @click="activeCategoryId = 'all'; isCategorySheetOpen = false"
            >
              <div class="flex items-center gap-3">
                <Sparkles class="w-5 h-5 shrink-0" />
                <div class="text-left">
                  <div class="font-bold">Semua Kategori</div>
                  <div class="text-[11px] opacity-80">Tampilkan seluruh 11 kategori MVG</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-background/20">
                {{ totalCatalogItems }}
              </span>
            </button>

            <!-- 2. Individual Categories -->
            <button
              v-for="cat in currentCatalogCategories"
              :key="cat.id"
              type="button"
              class="w-full min-h-[50px] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm transition-all border cursor-pointer active:scale-[0.99]"
              :class="[
                activeCategoryId === cat.id
                  ? 'bg-primary text-primary-foreground font-bold border-primary shadow-sm'
                  : 'bg-muted/30 hover:bg-muted text-foreground border-transparent'
              ]"
              @click="activeCategoryId = cat.id; isCategorySheetOpen = false"
            >
              <div class="flex items-center gap-3">
                <component :is="categoryIcons[cat.id] || Box" class="w-5 h-5 shrink-0" />
                <div class="text-left">
                  <div class="font-bold">{{ cat.name }}</div>
                  <div class="text-[11px] opacity-80">{{ cat.description }}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-background/20">
                {{ cat.itemCount }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FLOATING BACK-TO-TOP BUTTON (MOBILE ERGONOMICS) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3"
    >
      <button
        v-if="showBackToTop"
        type="button"
        class="fixed bottom-6 right-5 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150 border border-primary/20"
        title="Kembali ke atas"
        @click="scrollToTop"
      >
        <ArrowUp class="w-5 h-5" />
      </button>
    </transition>

    <!-- BATCH & QUANTITY SELECTION MODAL -->
    <BatchSelectDialog
      v-model:open="isBatchDialogOpen"
      :item="selectedItemForBatch"
      :selected-gudang="selectedGudang"
      @confirm="onBatchDialogConfirm"
    />

    <!-- FLOATING CART & SLIDE-OVER DRAWER FOR SALES QUOTATION -->
    <CartDrawer />
  </div>
</template>
