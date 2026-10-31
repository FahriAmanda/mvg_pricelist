<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  Package,
  ArrowLeft,
  Layers,
  Tag,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Clock,
  ArrowRight
} from '@lucide/vue'
import { useSyncedItems, type SyncedPricelistItem } from '~/composables/useSyncedItems'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const {
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
} = useSyncedItems()

// UI state
const isFilterExpanded = ref(true)
const selectedDetailItem = ref<SyncedPricelistItem | null>(null)
const isDetailModalOpen = ref(false)

onMounted(() => {
  fetchItems()
})

function formatRupiah(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
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

function openDetailModal(item: SyncedPricelistItem) {
  selectedDetailItem.value = item
  isDetailModalOpen.value = true
}

function closeDetailModal() {
  selectedDetailItem.value = null
  isDetailModalOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 pb-20">
    <!-- Top Sticky Header -->
    <header class="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Back Button & Branding -->
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/pricelist"
            class="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Kembali ke Pricelist"
          >
            <ArrowLeft class="w-4 h-4" />
          </NuxtLink>

          <div class="flex items-center justify-center h-10 rounded-xl bg-card border border-border/60 shadow-xs px-2 py-1 overflow-hidden">
            <img
              src="/mvg-header-logo.png"
              alt="Mitra Visual Group"
              class="h-full w-auto object-contain dark:brightness-110"
              onerror="this.onerror=null; this.src='/mvg-logo.png';"
            />
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">
                SYNCRON ITEM
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Pricelist VS M Items
              </span>
            </div>
            <p class="text-[11px] text-muted-foreground hidden sm:block">
              Audit Kesesuaian & Komparasi Item Katalog Pricelist vs Master Item ERP
            </p>
          </div>
        </div>

        <!-- Right Controls -->
        <div class="flex items-center gap-2">
          <!-- Refresh Button -->
          <Button
            variant="outline"
            size="sm"
            class="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted"
            :disabled="loading"
            @click="fetchItems"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            <span class="hidden sm:inline">Refresh Data</span>
          </Button>

          <!-- Live Status -->
          <div
            class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/70 text-[11px] text-muted-foreground bg-muted/30"
            title="Waktu Sinkronisasi Terakhir"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span class="font-mono text-[10px]">{{ formatTime(lastSyncTime) }}</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <!-- 1. KPI SUMMARY CARDS -->
      <section class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Total Synced -->
        <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Tersinkron</span>
            <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Boxes class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-black tracking-tight text-foreground">{{ summary.total }}</span>
            <p class="text-[11px] text-muted-foreground">Tersambung ke m_items</p>
          </div>
        </div>

        <!-- Match Perfect -->
        <div
          class="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500/40"
          :class="{ 'ring-2 ring-emerald-500/30': auditFilter === 'MATCH' }"
          @click="auditFilter = auditFilter === 'MATCH' ? 'ALL' : 'MATCH'"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Match Sempurna</span>
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{{ summary.match }}</span>
            <p class="text-[11px] text-muted-foreground">SKU & Harga Sesuai</p>
          </div>
        </div>

        <!-- Price Difference -->
        <div
          class="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-amber-500/40"
          :class="{ 'ring-2 ring-amber-500/30': auditFilter === 'PRICE_DIFF' }"
          @click="auditFilter = auditFilter === 'PRICE_DIFF' ? 'ALL' : 'PRICE_DIFF'"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Selisih Harga</span>
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">{{ summary.priceDiff }}</span>
            <p class="text-[11px] text-muted-foreground">Perlu Verifikasi Harga</p>
          </div>
        </div>

        <!-- SKU Difference -->
        <div
          class="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-violet-500/40"
          :class="{ 'ring-2 ring-violet-500/30': auditFilter === 'SKU_DIFF' }"
          @click="auditFilter = auditFilter === 'SKU_DIFF' ? 'ALL' : 'SKU_DIFF'"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Beda Kode/SKU</span>
            <div class="p-2 rounded-xl bg-violet-500/10 text-violet-500">
              <ArrowLeftRight class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-black tracking-tight text-violet-600 dark:text-violet-400">{{ summary.skuDiff }}</span>
            <p class="text-[11px] text-muted-foreground">SKU ≠ Kode Item ERP</p>
          </div>
        </div>

        <!-- Total Stock -->
        <div class="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Total Stok Tersedia</span>
            <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Warehouse class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-black tracking-tight text-cyan-600 dark:text-cyan-400">{{ summary.totalStock.toLocaleString('id-ID') }}</span>
            <p class="text-[11px] text-muted-foreground">Total unit di gudang lokal</p>
          </div>
        </div>
      </section>

      <!-- 2. FILTER & SEARCH PANEL (PERSIS GAMBAR 2 DARI ERP) -->
      <section class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <!-- Panel Header -->
        <div class="px-5 py-3.5 bg-muted/30 border-b border-border/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Filter class="w-4 h-4" />
            </div>
            <span class="text-sm font-black uppercase tracking-wider text-foreground">
              Filter & Search
            </span>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
            @click="isFilterExpanded = !isFilterExpanded"
          >
            <span>{{ isFilterExpanded ? 'Hide' : 'Show' }}</span>
            <ChevronUp v-if="isFilterExpanded" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
        </div>

        <!-- Panel Body -->
        <div v-show="isFilterExpanded" class="p-5 space-y-4">
          <!-- Row 1: Kategori, Brand, Model, Type -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <!-- Kategori -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Kategori</label>
              <select
                v-model="filterCategory"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option v-for="opt in categoryOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Brand -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Brand</label>
              <select
                v-model="filterBrand"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Brand</option>
                <option v-for="opt in brandOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Model -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Model</label>
              <select
                v-model="filterModel"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Model</option>
                <option v-for="opt in modelOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Type -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Type</label>
              <select
                v-model="filterType"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Type</option>
                <option v-for="opt in typeOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Row 2: Details, Detail2, Ukuran, Detail3 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <!-- Details -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Details</label>
              <select
                v-model="filterDetails"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Details</option>
                <option v-for="opt in detailsOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Detail2 -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Detail2</label>
              <select
                v-model="filterDetail2"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Detail2</option>
                <option v-for="opt in detail2Options" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Ukuran -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Ukuran</label>
              <select
                v-model="filterSize"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Ukuran</option>
                <option v-for="opt in sizeOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Detail3 -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase">Detail3</label>
              <select
                v-model="filterDetail3"
                class="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Detail3</option>
                <option v-for="opt in detail3Options" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Row 3: Pencarian, Tombol Cari, Filter Gudang, Reset Filter -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2 border-t border-border/60">
            <!-- Search Input -->
            <div class="relative flex-1">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari item / batch / gudang / SKU..."
                class="w-full h-10 pl-9 pr-3 rounded-xl border border-border/80 bg-background text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                @keyup.enter="applySearch"
              />
            </div>

            <!-- Button Cari (Biru persis ERP) -->
            <Button
              type="button"
              class="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-1.5 shrink-0 shadow-xs transition-colors"
              @click="applySearch"
            >
              <Search class="w-3.5 h-3.5" />
              <span>Cari</span>
            </Button>

            <!-- Filter Gudang -->
            <div class="w-full md:w-56 shrink-0">
              <select
                v-model="selectedWarehouse"
                class="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Gudang</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">
                  {{ w.nama_gudang }}
                </option>
              </select>
            </div>

            <!-- Reset Filter -->
            <Button
              type="button"
              variant="outline"
              class="h-10 px-4 rounded-xl border-border/80 text-xs font-bold gap-1.5 shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              @click="resetFilters"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </Button>
          </div>
        </div>
      </section>

      <!-- 3. TABLE COMPARISON HEAD-TO-HEAD (VS) -->
      <section class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <!-- Sub-header & Count Controls -->
        <div class="px-5 py-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-black uppercase tracking-tight text-foreground">
              Daftar Pasangan Sinkronisasi
            </span>
            <Badge variant="outline" class="text-xs font-mono font-bold">
              {{ filteredItems.length }} item ditemukan
            </Badge>
          </div>

          <!-- Page size selector -->
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Baris per halaman:</span>
            <select
              v-model="pageSize"
              class="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs font-medium text-foreground focus:outline-none"
              @change="currentPage = 1"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-12 text-center space-y-3">
          <RefreshCw class="w-8 h-8 mx-auto text-primary animate-spin" />
          <p class="text-sm font-medium text-muted-foreground">Memuat data sinkronisasi item...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-12 text-center space-y-3">
          <AlertTriangle class="w-8 h-8 mx-auto text-rose-500" />
          <p class="text-sm font-bold text-rose-500">{{ error }}</p>
          <Button variant="outline" size="sm" class="rounded-xl" @click="fetchItems">Coba Lagi</Button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0" class="p-12 text-center space-y-3">
          <Boxes class="w-8 h-8 mx-auto text-muted-foreground" />
          <p class="text-sm font-bold text-foreground">Tidak ada item yang sesuai dengan filter</p>
          <p class="text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau reset filter</p>
          <Button variant="outline" size="sm" class="rounded-xl mt-2" @click="resetFilters">Reset Filter</Button>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-muted/40 border-b border-border/80 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                <th class="py-3 px-3 text-center w-12">No</th>
                <th class="py-3 px-4 w-[38%] border-r border-border/60">
                  <div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Tag class="w-3.5 h-3.5" />
                    <span>ITEM PRICELIST (KATALOG)</span>
                  </div>
                </th>
                <th class="py-3 px-3 text-center w-28 border-r border-border/60">
                  <div class="flex items-center justify-center gap-1">
                    <ArrowLeftRight class="w-3.5 h-3.5 text-primary" />
                    <span>VS / AUDIT</span>
                  </div>
                </th>
                <th class="py-3 px-4 w-[45%]">
                  <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Boxes class="w-3.5 h-3.5" />
                    <span>ITEM MASTER ERP (M_ITEMS)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr
                v-for="(item, index) in paginatedItems"
                :key="item.id"
                class="hover:bg-muted/30 transition-colors"
                :class="{ 'bg-amber-500/5': !item.audit.is_price_match || !item.audit.is_sku_match }"
              >
                <!-- Nomor -->
                <td class="py-3.5 px-3 text-center font-mono text-[11px] text-muted-foreground align-top">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>

                <!-- SISI KIRI: ITEM PRICELIST -->
                <td class="py-3.5 px-4 border-r border-border/60 align-top space-y-2">
                  <div class="flex items-start gap-3">
                    <!-- Image / Icon -->
                    <div class="w-12 h-12 rounded-xl bg-muted/60 border border-border/70 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        v-if="item.pricelist.image"
                        :src="item.pricelist.image"
                        :alt="item.pricelist.model"
                        class="w-full h-full object-cover"
                        onerror="this.onerror=null; this.style.display='none';"
                      />
                      <Package v-else class="w-5 h-5 text-muted-foreground" />
                    </div>

                    <!-- Details -->
                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {{ item.pricelist.sku }}
                        </span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {{ item.pricelist.category_name }}
                        </span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" :class="item.pricelist.catalog === 'mvg' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'">
                          {{ item.pricelist.catalog.toUpperCase() }}
                        </span>
                      </div>

                      <div class="text-xs font-bold text-foreground">
                        {{ item.pricelist.model }}
                      </div>

                      <div v-if="item.pricelist.type && item.pricelist.type !== '-'" class="text-[11px] text-muted-foreground">
                        Tipe: {{ item.pricelist.type }}
                      </div>

                      <!-- Approved Price -->
                      <div class="pt-1 flex items-center gap-2">
                        <span class="text-xs font-black text-foreground">
                          {{ formatRupiah(item.pricelist.price) }}
                        </span>
                        <span class="text-[10px] text-muted-foreground font-semibold">
                          (Pricelist Approved)
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- SISI TENGAH: VS / AUDIT STATUS -->
                <td class="py-3.5 px-3 border-r border-border/60 text-center align-top space-y-1.5">
                  <!-- Match Badge -->
                  <div v-if="item.audit.is_sku_match && item.audit.is_price_match">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 class="w-3 h-3" />
                      MATCH
                    </span>
                  </div>

                  <!-- Price Diff Badge -->
                  <div v-else-if="!item.audit.is_price_match">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <AlertTriangle class="w-3 h-3" />
                      SELISIH
                    </span>
                    <div class="text-[10px] font-bold font-mono pt-0.5" :class="item.audit.price_diff > 0 ? 'text-amber-600' : 'text-rose-500'">
                      {{ item.audit.price_diff > 0 ? '+' : '' }}{{ formatRupiah(item.audit.price_diff) }}
                    </div>
                  </div>

                  <!-- SKU Diff Badge -->
                  <div v-if="!item.audit.is_sku_match">
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                      <ArrowLeftRight class="w-2.5 h-2.5" />
                      BEDA KODE
                    </span>
                  </div>

                  <!-- Quick Detail Modal Button -->
                  <button
                    type="button"
                    class="mt-1 text-[10px] text-primary hover:underline font-semibold block mx-auto"
                    @click="openDetailModal(item)"
                  >
                    Lihat Stok
                  </button>
                </td>

                <!-- SISI KANAN: ITEM DARI M_ITEMS (ERP) -->
                <td class="py-3.5 px-4 align-top space-y-2">
                  <div class="space-y-1.5">
                    <!-- Kode Item ERP & UOM -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {{ item.erp.kode_item }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground font-mono">
                        {{ item.erp.uom }}
                      </span>
                      <span v-if="item.erp.available_stock > 0" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        Avail: {{ item.erp.available_stock }}
                      </span>
                      <span v-else class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Stok 0
                      </span>
                    </div>

                    <!-- Nama Item Master -->
                    <div class="text-xs font-bold text-foreground">
                      {{ item.erp.nama_item }}
                    </div>

                    <!-- Hierarki 8-Level Badges -->
                    <div class="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                      <span class="bg-muted px-1.5 py-0.5 rounded">{{ item.erp.group_category_name }}</span>
                      <span>›</span>
                      <span class="bg-muted px-1.5 py-0.5 rounded">{{ item.erp.group_brand_name }}</span>
                      <span>›</span>
                      <span class="bg-muted px-1.5 py-0.5 rounded">{{ item.erp.group_model_name }}</span>
                      <template v-if="item.erp.group_type_name && item.erp.group_type_name !== '-'">
                        <span>›</span>
                        <span class="bg-muted px-1.5 py-0.5 rounded">{{ item.erp.group_type_name }}</span>
                      </template>
                      <template v-if="item.erp.group_details_name && item.erp.group_details_name !== '-'">
                        <span>›</span>
                        <span class="bg-muted px-1.5 py-0.5 rounded">{{ item.erp.group_details_name }}</span>
                      </template>
                    </div>

                    <!-- Harga Master ERP -->
                    <div class="pt-1 flex items-center gap-3 text-xs">
                      <div>
                        <span class="text-[10px] text-muted-foreground block">Harga Cash:</span>
                        <span class="font-bold text-foreground">{{ formatRupiah(item.erp.harga_cash) }}</span>
                      </div>
                      <div v-if="item.erp.harga_kredit">
                        <span class="text-[10px] text-muted-foreground block">Kredit:</span>
                        <span class="font-bold text-muted-foreground">{{ formatRupiah(item.erp.harga_kredit) }}</span>
                      </div>
                      <div v-if="item.erp.bt_price">
                        <span class="text-[10px] text-muted-foreground block">Bottom Price:</span>
                        <span class="font-bold text-muted-foreground">{{ formatRupiah(item.erp.bt_price) }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Pagination Footer -->
        <div class="px-5 py-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
          <div class="text-xs text-muted-foreground">
            Menampilkan
            <span class="font-bold text-foreground">
              {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredItems.length) }}
            </span>
            dari
            <span class="font-bold text-foreground">{{ filteredItems.length }}</span>
            item
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="h-8 px-3 rounded-lg text-xs"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              Sebelumnya
            </Button>

            <span class="text-xs font-mono font-bold px-2">
              Halaman {{ currentPage }} dari {{ totalPages }}
            </span>

            <Button
              variant="outline"
              size="sm"
              class="h-8 px-3 rounded-lg text-xs"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </section>
    </main>

    <!-- 4. MODAL DETAIL STOK & BATCH PER GUDANG -->
    <div
      v-if="isDetailModalOpen && selectedDetailItem"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      @click.self="closeDetailModal"
    >
      <div class="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border/80 bg-muted/30 flex items-center justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {{ selectedDetailItem.erp.kode_item }}
              </span>
              <span class="text-xs font-bold text-muted-foreground">VS</span>
              <span class="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {{ selectedDetailItem.pricelist.sku }}
              </span>
            </div>
            <h3 class="text-sm font-black text-foreground">
              {{ selectedDetailItem.erp.nama_item }}
            </h3>
          </div>

          <Button variant="ghost" size="sm" class="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground" @click="closeDetailModal">
            ✕
          </Button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-5 overflow-y-auto">
          <!-- Komparasi Cepat -->
          <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div>
              <span class="text-[11px] font-bold text-muted-foreground uppercase block">Harga Katalog Pricelist</span>
              <span class="text-base font-black text-blue-600 dark:text-blue-400">
                {{ formatRupiah(selectedDetailItem.pricelist.price) }}
              </span>
            </div>
            <div>
              <span class="text-[11px] font-bold text-muted-foreground uppercase block">Harga Master ERP (Cash)</span>
              <span class="text-base font-black text-emerald-600 dark:text-emerald-400">
                {{ formatRupiah(selectedDetailItem.erp.harga_cash) }}
              </span>
            </div>
          </div>

          <!-- Total Stok -->
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 rounded-xl bg-card border border-border/70">
              <span class="text-[10px] font-bold text-muted-foreground uppercase block">Stok Tersedia</span>
              <span class="text-lg font-black text-cyan-600 dark:text-cyan-400">
                {{ selectedDetailItem.erp.available_stock }} {{ selectedDetailItem.erp.uom }}
              </span>
            </div>
            <div class="p-3 rounded-xl bg-card border border-border/70">
              <span class="text-[10px] font-bold text-muted-foreground uppercase block">Stok Fisik</span>
              <span class="text-lg font-black text-foreground">
                {{ selectedDetailItem.erp.physical_stock }} {{ selectedDetailItem.erp.uom }}
              </span>
            </div>
            <div class="p-3 rounded-xl bg-card border border-border/70">
              <span class="text-[10px] font-bold text-muted-foreground uppercase block">Stok Terkunci (Lock)</span>
              <span class="text-lg font-black text-amber-600 dark:text-amber-400">
                {{ selectedDetailItem.erp.locked_stock }} {{ selectedDetailItem.erp.uom }}
              </span>
            </div>
          </div>

          <!-- Rincian Batch per Gudang -->
          <div class="space-y-2">
            <h4 class="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Warehouse class="w-3.5 h-3.5" />
              <span>Rincian Batch per Gudang (Live ERP)</span>
            </h4>

            <div v-if="selectedDetailItem.erp.batches.length === 0" class="p-4 rounded-xl bg-muted/20 border border-border/60 text-center text-xs text-muted-foreground">
              Tidak ada rincian stok batch fisik di gudang lokal saat ini.
            </div>

            <div v-else class="border border-border/80 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-muted/50 border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase">
                  <tr>
                    <th class="py-2.5 px-3">Gudang</th>
                    <th class="py-2.5 px-3">Batch</th>
                    <th class="py-2.5 px-3 text-right">Fisik</th>
                    <th class="py-2.5 px-3 text-right">Lock</th>
                    <th class="py-2.5 px-3 text-right">Tersedia</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  <tr v-for="(b, bi) in selectedDetailItem.erp.batches" :key="bi" class="hover:bg-muted/30">
                    <td class="py-2.5 px-3 font-semibold">{{ b.nama_gudang }}</td>
                    <td class="py-2.5 px-3 font-mono text-muted-foreground">{{ b.batch_number }}</td>
                    <td class="py-2.5 px-3 text-right font-mono">{{ b.physical_stock }}</td>
                    <td class="py-2.5 px-3 text-right font-mono text-amber-600">{{ b.locked_stock }}</td>
                    <td class="py-2.5 px-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {{ b.available_stock }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" class="rounded-xl" @click="closeDetailModal">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
