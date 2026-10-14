<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  Calculator,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  Video
} from '@lucide/vue'
import { usePricelist } from '~/composables/usePricelist'
import ThemeToggle from '~/components/ThemeToggle.vue'
import PriceCalculatorDialog from '~/components/PriceCalculatorDialog.vue'
import FieldSelect from '~/components/FieldSelect.vue'
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
  isSyncing,
  isLiveConnected,
  lastSyncTime,
  searchQuery,
  typeFilter,
  sortBy,
  updatedItemIds,
  triggerSync
} = usePricelist()

// Set active category from URL query if provided (e.g. /pricelist?category=mvg_moka_effect)
onMounted(() => {
  const catQuery = route.query.category as string
  if (catQuery) {
    activeCategoryId.value = catQuery
  }
})

watch(
  () => route.query.category,
  (newCat) => {
    if (newCat && typeof newCat === 'string') {
      activeCategoryId.value = newCat
    }
  }
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

// Select Options for FieldSelect
const categorySelectOptions = computed(() =>
  currentCatalogCategories.value.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.itemCount} item)`
  }))
)

const typeSelectOptions = computed(() => [
  { value: 'ALL', label: `Semua Tipe (${activeItems.value?.length || 0})` },
  ...availableTypes.value.map((t) => ({ value: t, label: t }))
])

const sortSelectOptions = [
  { value: 'default', label: 'Urutan Standar' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'name', label: 'Nama A-Z' }
]

// Display View Mode: 'cards' (Mobile-First default) or 'table'
const viewMode = ref<'cards' | 'table'>('cards')

// Calculator dialog state
const isCalculatorOpen = ref(false)
const selectedItemForCalc = ref<PricelistItem | null>(null)

function openCalculator(item: PricelistItem | null = null) {
  selectedItemForCalc.value = item
  isCalculatorOpen.value = true
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

function handleManualSync() {
  triggerSync()
}

// Direct Google Sheet source link
const currentSheetUrl = computed(() => {
  if (currentCategory.value?.customUrl) {
    return currentCategory.value.customUrl.replace('&output=csv', '')
  }
  if (currentCategory.value?.gid) {
    return `https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMDmEzh4w7r09LH3Quoio4lHUZIR7Krur4FNfuxCskrN0onGEyiDGtr_ff7NGRG47Uq8HaNhXmS1a/pubhtml?gid=${currentCategory.value.gid}&single=true`
  }
  return '#'
})

// Expanded state for LED Cube parts breakdown on mobile cards
const expandedCubeId = ref<string | null>(null)
function toggleCubeExpand(id: string) {
  expandedCubeId.value = expandedCubeId.value === id ? null : id
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 pb-12">
    <!-- Top Sticky Navigation (Mobile-First) -->
    <header
      v-motion
      :initial="{ opacity: 0, y: -15 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 350, ease: 'easeOut' } }"
      class="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md"
    >
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <!-- Back to Gate + Logo & Title Section -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Kembali ke Menu Gate"
          >
            <ArrowLeft class="w-4 h-4" />
          </NuxtLink>

          <div class="flex items-center justify-center h-10 sm:h-11 rounded-xl bg-card border border-border/60 shadow-xs px-2 py-1 shrink-0 overflow-hidden">
            <img
              src="/mvg-header-logo.png"
              alt="Mitra Visual Group"
              class="h-full w-auto object-contain dark:brightness-110"
              onerror="this.onerror=null; this.src='/mvg-logo.png';"
            />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="text-sm sm:text-base font-black tracking-tight text-foreground uppercase truncate">
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

          <Button
            variant="outline"
            size="sm"
            class="h-9 w-9 p-0 sm:w-auto sm:px-2.5 sm:gap-1.5 text-xs font-medium border-border/80"
            :disabled="isSyncing"
            title="Sinkronkan Data Google Sheets"
            @click="handleManualSync"
          >
            <RefreshCw
              class="w-4 h-4"
              :class="{ 'animate-spin text-primary': isSyncing }"
            />
            <span class="hidden sm:inline">{{ isSyncing ? 'Syncing...' : 'Sync' }}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            class="h-9 w-9 p-0 sm:w-auto sm:px-2.5 sm:gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="Buka Form Kalkulator Penawaran"
            @click="openCalculator(null)"
          >
            <Calculator class="w-4 h-4" />
            <span class="hidden sm:inline">Kalkulator</span>
          </Button>

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
              11
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
              10
            </span>
          </button>
        </div>

        <!-- Catalog Badge Info -->
        <div class="text-xs text-muted-foreground hidden sm:flex items-center gap-2 font-medium">
          <span>Katalog Terpilih:</span>
          <Badge variant="outline" class="font-bold uppercase tracking-wider text-[11px]">
            {{ activeCatalog === 'mvg' ? 'Mitra Visual Group (11 Kategori)' : 'Asia Visiotron (10 Kategori)' }}
          </Badge>
        </div>
      </section>

      <!-- 2. CATEGORY SWITCHER (Mobile Dropdown + Swipeable Pills) -->
      <section class="space-y-2.5">
        <div class="sm:hidden">
          <FieldSelect
            v-model="activeCategoryId"
            label="Pilih Kategori Produk"
            :options="categorySelectOptions"
            placeholder="Pilih Kategori..."
          >
            <template #prefix>
              <component
                :is="categoryIcons[activeCategoryId] || Box"
                class="w-4 h-4 text-primary shrink-0"
              />
            </template>
          </FieldSelect>
        </div>

        <div class="relative">
          <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
            <button
              v-for="cat in currentCatalogCategories"
              :key="cat.id"
              type="button"
              v-motion
              :hovered="{ y: -1.5, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 20 } }"
              :tapped="{ scale: 0.98 }"
              class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 whitespace-nowrap border shrink-0 touch-manipulation"
              :class="[
                activeCategoryId === cat.id
                  ? (activeCatalog === 'mvg'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25')
                  : 'bg-card hover:bg-muted text-foreground border-border/70 hover:border-border'
              ]"
              @click="activeCategoryId = cat.id"
            >
              <component
                :is="categoryIcons[cat.id] || Box"
                class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                :class="activeCategoryId === cat.id ? 'text-white' : (activeCatalog === 'mvg' ? 'text-amber-500' : 'text-primary')"
              />
              <span>{{ cat.name }}</span>
              <span
                class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                :class="activeCategoryId === cat.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'"
              >
                {{ cat.itemCount }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3. SEARCH & FILTERS BAR -->
      <section
        v-motion
        :initial="{ opacity: 0, y: 15 }"
        :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24, delay: 90 } }"
        class="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3"
      >
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Cari SKU, nama model, pitch, ukuran..."
              class="pl-9 h-10 text-xs sm:text-sm bg-background/80 border-border/70 focus-visible:ring-primary rounded-xl"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1"
              @click="searchQuery = ''"
            >
              ×
            </button>
          </div>

          <div class="flex items-center gap-2">
            <div v-if="availableTypes.length > 0" class="flex-1 sm:flex-initial min-w-[145px] sm:min-w-[170px]">
              <FieldSelect
                v-model="typeFilter"
                :options="typeSelectOptions"
                placeholder="Semua Tipe"
                :dropdown-min-width="200"
              />
            </div>

            <div class="flex-1 sm:flex-initial min-w-[135px] sm:min-w-[155px]">
              <FieldSelect
                v-model="sortBy"
                :options="sortSelectOptions"
                placeholder="Urutan..."
                :dropdown-min-width="170"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span class="truncate font-medium">
            {{ currentCategory?.name }}: {{ currentCategory?.description }}
          </span>
          <span class="font-bold shrink-0 text-foreground">
            {{ filteredItems.length }} item
          </span>
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
        <!-- A. CARDS GRID VIEW -->
        <div
          v-if="viewMode === 'cards'"
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
            class="group rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-primary/50 transition-colors duration-150"
            :class="{
              'ring-2 ring-emerald-500 bg-emerald-500/5': updatedItemIds.has(item.id)
            }"
          >
            <!-- Card Header: SKU & Type Badge -->
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2 min-w-0">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors min-w-0 max-w-[62%] shrink"
                  title="Klik untuk menyalin SKU"
                  @click="copyToClipboard(item.sku)"
                >
                  <span class="truncate">{{ item.sku }}</span>
                  <Check v-if="copiedSku === item.sku" class="w-3 h-3 text-emerald-500 shrink-0" />
                  <Copy v-else class="w-3 h-3 shrink-0 opacity-60" />
                </button>

                <span
                  v-if="item.type"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase shrink-0 max-w-[36%] truncate"
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

              <!-- Product Name / Title -->
              <div>
                <h3 class="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {{ item.model || item.description }}
                </h3>
                <p v-if="item.description && item.description !== item.model" class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {{ item.description }}
                </p>
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
                  v-if="item.metadata?.hargaKreditFormatted"
                  class="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono"
                  title="Harga Kredit"
                >
                  Kredit: {{ item.metadata.hargaKreditFormatted }}
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

              <!-- Special Breakdown: LED Poster Dual Prices -->
              <div v-if="item.category === 'led_poster'" class="pt-2 grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                  <p class="text-[10px] text-muted-foreground">Cabinet Flat</p>
                  <p class="font-bold text-foreground">{{ item.priceFormatted }}</p>
                </div>
                <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                  <p class="text-[10px] text-muted-foreground">Foldable</p>
                  <p class="font-bold text-foreground">{{ item.metadata?.foldablePriceFormatted || '-' }}</p>
                </div>
              </div>

              <!-- Special Breakdown: LED Cube Dual Prices -->
              <div v-if="item.category === 'led_cube'" class="pt-2 space-y-1.5 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2 rounded-xl bg-muted/40 border border-border/50">
                    <p class="text-[10px] text-muted-foreground">Cube 4 Sisi</p>
                    <p class="font-bold text-foreground">{{ item.priceFormatted }}</p>
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

            <!-- Card Bottom: Price & Quick Action -->
            <div class="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                  {{
                    item.category.includes('rental')
                      ? 'Harga Cash'
                      : item.category === 'led_poster'
                      ? 'Harga Flat'
                      : item.category === 'led_cube'
                      ? 'Harga 4 Sisi'
                      : 'Harga Satuan'
                  }}
                </p>
                <div class="flex items-baseline gap-1.5 flex-wrap">
                  <span class="text-base sm:text-lg font-black text-foreground tracking-tight whitespace-nowrap">
                    {{ item.priceFormatted }}
                  </span>
                  <span
                    v-if="item.previousPrice && item.previousPrice !== item.price"
                    class="text-[10px] text-muted-foreground line-through whitespace-nowrap"
                  >
                    Rp {{ item.previousPrice.toLocaleString('id-ID') }}
                  </span>
                </div>
              </div>

              <Button
                v-motion
                :hovered="{ scale: 1.05, transition: { type: 'spring', stiffness: 450, damping: 20 } }"
                :tapped="{ scale: 0.95 }"
                variant="outline"
                size="sm"
                class="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                title="Hitung Penawaran dengan AutoForm"
                @click="openCalculator(item)"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span>Hitung</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- B. DESKTOP SPREADSHEET TABLE VIEW -->
        <div v-else class="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div class="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader class="bg-muted/40">
                <TableRow class="hover:bg-transparent">
                  <TableHead class="w-[60px] text-xs font-semibold">No</TableHead>
                  <TableHead class="w-[180px] text-xs font-semibold">SKU</TableHead>
                  <TableHead class="min-w-[220px] text-xs font-semibold">Model & Deskripsi</TableHead>
                  <TableHead class="w-[130px] text-xs font-semibold">Tipe</TableHead>
                  <TableHead class="w-[120px] text-xs font-semibold">Ukuran / Spek</TableHead>

                  <TableHead v-if="activeCategoryId === 'led_poster'" class="w-[150px] text-xs font-semibold">
                    Foldable
                  </TableHead>
                  <TableHead v-if="activeCategoryId === 'led_cube'" class="w-[150px] text-xs font-semibold">
                    Cube 5 Sisi
                  </TableHead>
                  <TableHead v-if="activeCategoryId.includes('rental')" class="w-[150px] text-xs font-semibold">
                    Harga Kredit
                  </TableHead>
                  <TableHead v-if="activeCategoryId === 'magnustek_tkdn'" class="w-[130px] text-xs font-semibold">
                    Nilai TKDN
                  </TableHead>

                  <TableHead class="w-[160px] text-right text-xs font-semibold">
                    {{
                      activeCategoryId.includes('rental')
                        ? 'Harga Cash'
                        : activeCategoryId === 'led_poster'
                        ? 'Harga Flat'
                        : activeCategoryId === 'led_cube'
                        ? 'Cube 4 Sisi'
                        : 'Harga Satuan'
                    }}
                  </TableHead>
                  <TableHead class="w-[80px] text-center text-xs font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow
                  v-for="(item, idx) in filteredItems"
                  :key="item.id"
                  class="transition-colors duration-150 group"
                  :class="{
                    'bg-emerald-500/10 dark:bg-emerald-500/20 font-medium': updatedItemIds.has(item.id)
                  }"
                >
                  <TableCell class="text-xs text-muted-foreground font-mono">
                    {{ idx + 1 }}
                  </TableCell>

                  <TableCell>
                    <div class="flex items-center gap-1.5">
                      <Badge variant="secondary" class="font-mono text-[11px] font-normal px-2 py-0.5 max-w-[150px] truncate">
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

                  <TableCell v-if="activeCategoryId === 'led_poster'" class="text-xs font-medium">
                    {{ item.metadata?.foldablePriceFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId === 'led_cube'" class="text-xs font-medium">
                    {{ item.metadata?.price5SideFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId.includes('rental')" class="text-xs font-medium text-muted-foreground font-mono">
                    {{ item.metadata?.hargaKreditFormatted || '-' }}
                  </TableCell>
                  <TableCell v-if="activeCategoryId === 'magnustek_tkdn'">
                    <Badge variant="outline" class="font-mono text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      {{ item.metadata?.tkdnValue || '-' }}
                    </Badge>
                  </TableCell>

                  <TableCell class="text-right">
                    <span class="text-xs sm:text-sm font-bold text-foreground">
                      {{ item.priceFormatted }}
                    </span>
                  </TableCell>

                  <TableCell class="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 w-7 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Hitung Penawaran"
                      @click="openCalculator(item)"
                    >
                      <Sparkles class="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>

    <!-- Global AutoForm Price Calculator Dialog -->
    <PriceCalculatorDialog
      v-model:open="isCalculatorOpen"
      :item="selectedItemForCalc"
    />

    <!-- Mobile-Friendly Footer -->
    <footer class="mt-auto border-t border-border/80 bg-background/60 py-4 text-center text-[11px] text-muted-foreground px-4">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="font-medium">© 2026 Mitra Visual Group (MVG) & Asia Visiotron. All rights reserved.</p>
        <div class="flex items-center gap-3">
          <a
            :href="currentSheetUrl"
            target="_blank"
            rel="noopener"
            class="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>Google Sheets Sumber</span>
            <ExternalLink class="w-3 h-3" />
          </a>
          <span>•</span>
          <span class="font-mono">Auto-Sync 60s SSE</span>
        </div>
      </div>
    </footer>
  </div>
</template>
