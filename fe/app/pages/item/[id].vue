<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileText,
  FileDown,
  Video,
  ZoomIn,
  X,
  Share2,
  Sparkles,
  ShieldCheck,
  Info,
  Layers,
  Box,
  Boxes,
  Cpu,
  Plug,
  Calculator,
  Printer,
  Clock,
  ChevronRight,
  TrendingUp,
  Tag,
  ArrowRight,
  Maximize2
} from '@lucide/vue'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PricelistItem, SheetCategory } from '~/types/pricelist'

const route = useRoute()
const router = useRouter()
const itemId = computed(() => (route.params.id as string) || '')

interface ItemDetailResponse {
  item: PricelistItem
  category: SheetCategory
  categoryExtra?: {
    bannerTitle?: string
    bannerSubtitle?: string
    bannerImage?: string
    kursUSD?: string
    notes?: string[]
    comparisonChart?: string
  }
  relatedItems?: PricelistItem[]
  lastSync?: string
}

const data = ref<ItemDetailResponse | null>(null)
const isLoading = ref<boolean>(true)
const errorMessage = ref<string | null>(null)

// UI States
const activeImageIndex = ref<number>(0)
const isLightboxOpen = ref<number | boolean>(false)
const copiedType = ref<string | null>(null)
const orderQty = ref<number>(1)
const activeTab = ref<'specs' | 'bom' | 'terms' | 'comparison'>('specs')

// Fetch Item Data
async function loadItem() {
  if (!itemId.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    const res = await $fetch<ItemDetailResponse>(`/api/sheets/item/${encodeURIComponent(itemId.value)}`)
    data.value = res
    activeImageIndex.value = 0
    if (res?.item?.category === 'led_poster' || res?.item?.metadata?.moduleUnitPrice) {
      activeTab.value = 'bom'
    }
  } catch (err: any) {
    console.error('Failed to load item detail:', err)
    errorMessage.value = err?.statusMessage || err?.message || 'Item tidak ditemukan atau gagal dimuat'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadItem()
})

const item = computed(() => data.value?.item)
const category = computed(() => data.value?.category)
const categoryExtra = computed(() => data.value?.categoryExtra)
const relatedItems = computed(() => data.value?.relatedItems || [])

// Gallery Images
const galleryImages = computed<string[]>(() => {
  if (!item.value) return []
  const list: string[] = []
  if (item.value.images && Array.isArray(item.value.images) && item.value.images.length > 0) {
    list.push(...item.value.images)
  } else if (item.value.image) {
    list.push(item.value.image)
  }
  if (item.value.comparisonChart && !list.includes(item.value.comparisonChart)) {
    list.push(item.value.comparisonChart)
  }
  return list.length > 0 ? list : ['/images/products/av-qiangli-module.svg']
})

const currentImage = computed(() => galleryImages.value[activeImageIndex.value] || galleryImages.value[0])

// Format Rupiah
function formatRupiah(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '-'
  return `Rp ${val.toLocaleString('id-ID')}`
}

// Calculation for Quantity Stepper
const creditUnitPrice = computed(() => {
  return item.value?.metadata?.priceKredit || item.value?.metadata?.hargaKredit || 0
})

const totalCash = computed(() => {
  if (!item.value?.price) return 0
  return item.value.price * Math.max(1, orderQty.value)
})

const totalKredit = computed(() => {
  if (!creditUnitPrice.value) return 0
  return creditUnitPrice.value * Math.max(1, orderQty.value)
})

const cashSavings = computed(() => {
  if (totalKredit.value > totalCash.value && totalCash.value > 0) {
    return totalKredit.value - totalCash.value
  }
  return 0
})

// Copy helpers
async function copyText(text: string, typeName: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedType.value = typeName
    setTimeout(() => {
      if (copiedType.value === typeName) copiedType.value = null
    }, 2500)
  } catch (e) {
    console.error('Failed to copy', e)
  }
}

function copyQuoteText() {
  if (!item.value) return
  const isRental = item.value.category?.includes('rental')
  const lines = [
    `*PENAWARAN RESMI MITRA VISUAL GROUP (MVG)*`,
    `----------------------------------------`,
    `*Produk:* ${item.value.model}`,
    `*SKU:* ${item.value.sku}`,
    `*Kategori:* ${category.value?.name || item.value.category}`,
    item.value.size ? `*Ukuran / Dimensi:* ${item.value.size}` : null,
    item.value.type ? `*Tipe:* ${item.value.type}` : null,
    `----------------------------------------`,
    `*Jumlah Pesanan:* ${orderQty.value} unit`,
    `*Harga Satuan Cash:* ${formatRupiah(item.value.price)}`,
    item.value.metadata?.priceKredit ? `*Harga Satuan Kredit:* ${formatRupiah(item.value.metadata.priceKredit)}` : null,
    `----------------------------------------`,
    `*TOTAL HARGA CASH:* ${formatRupiah(totalCash.value)}`,
    item.value.metadata?.priceKredit ? `*TOTAL HARGA KREDIT:* ${formatRupiah(totalKredit.value)}` : null,
    cashSavings.value > 0 ? `(Hemat Pembayaran Cash: ${formatRupiah(cashSavings.value)})` : null,
    `----------------------------------------`,
    categoryExtra.value?.kursUSD ? `*Referensi Kurs:* ${categoryExtra.value.kursUSD}` : null,
    `*Katalog Resmi:* https://pricelist.mitravisualgroup.com/item/${item.value.id}`
  ].filter(Boolean)

  copyText(lines.join('\n'), 'quote')
}

// Copy full specifications
function copyFullSpecs() {
  if (!item.value) return
  const lines = [
    `=== SPESIFIKASI TEKNIS & RINCIAN ITEM ===`,
    `Model: ${item.value.model}`,
    `SKU: ${item.value.sku}`,
    `Kategori: ${category.value?.name || item.value.category}`,
    `Katalog: ${item.value.catalog === 'mvg' ? 'PRICELIST MVG' : 'AV PRICE LIST'}`,
    item.value.size ? `Ukuran / Dimensi: ${item.value.size}` : null,
    item.value.type ? `Form Factor / Tipe: ${item.value.type}` : null,
    `Harga Satuan Cash: ${formatRupiah(item.value.price)}`,
    item.value.metadata?.priceKredit ? `Harga Satuan Kredit: ${formatRupiah(item.value.metadata.priceKredit)}` : null,
    item.value.metadata?.foldablePriceFormatted ? `Harga Cabinet Foldable: ${item.value.metadata.foldablePriceFormatted}` : null,
    item.value.metadata?.price5SideFormatted ? `Harga Cube 5 Sisi: ${item.value.metadata.price5SideFormatted}` : null,
    item.value.metadata?.tkdnValue ? `Nilai TKDN: ${item.value.metadata.tkdnValue}%` : null,
    `----------------------------------------`,
    ...specRows.value.map((r) => `${r.label}: ${r.value}`)
  ].filter(Boolean)

  copyText(lines.join('\n'), 'specs')
}

// Print / PDF Export
function printDetail() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

// Back navigation
function goBack() {
  if (category.value) {
    router.push(`/pricelist?catalog=${category.value.catalog}&category=${category.value.id}`)
  } else {
    router.push('/pricelist?catalog=mvg')
  }
}

// Navigate to related item
function goToItem(targetId: string) {
  router.push(`/item/${targetId}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Spec Matrix
const specRows = computed(() => {
  if (!item.value) return []
  const rows: { label: string; value: string; isHighlight?: boolean }[] = [
    { label: 'Nama Resmi Model', value: item.value.model, isHighlight: true },
    { label: 'SKU Item', value: item.value.sku, isHighlight: true },
    { label: 'Kategori Katalog', value: category.value?.name || item.value.category },
    { label: 'Katalog Induk', value: item.value.catalog === 'mvg' ? 'PRICELIST MVG (Mitra Visual Group)' : 'AV PRICE LIST (Asia Visiotron)' }
  ]

  if (item.value.type) {
    rows.push({ label: 'Form Factor / Tipe', value: item.value.type })
  }
  if (item.value.size) {
    rows.push({ label: 'Ukuran Fisik / Dimensi', value: item.value.size })
  }
  if (item.value.metadata?.curve) {
    rows.push({ label: 'Kemampuan Curve', value: item.value.metadata.curve === 'Curve' ? 'Support Lengkung (Curved Angle Assembly)' : 'Flat Panel Standard' })
  }
  if (item.value.metadata?.specification) {
    rows.push({ label: 'Spesifikasi & Hardware', value: item.value.metadata.specification })
  }
  if (item.value.metadata?.watt) {
    rows.push({ label: 'Konsumsi Daya / Wattage', value: item.value.metadata.watt })
  }
  if (item.value.metadata?.priceFlatFormatted) {
    rows.push({ label: 'Harga Cabinet Flat (Include A35)', value: item.value.metadata.priceFlatFormatted, isHighlight: true })
  }
  if (item.value.metadata?.foldablePriceFormatted) {
    rows.push({ label: 'Harga Cabinet Foldable (Include A35)', value: item.value.metadata.foldablePriceFormatted, isHighlight: true })
  }
  if (item.value.metadata?.moduleUnitPrice) {
    rows.push({
      label: 'Komponen Modul LED',
      value: `${item.value.metadata.modulePcs || 24} Pcs × ${formatRupiah(item.value.metadata.moduleUnitPrice)} = ${formatRupiah(item.value.metadata.moduleTotalPrice)}`
    })
    rows.push({
      label: 'Rangka Kabinet Flat / Foldable',
      value: `Flat: ${formatRupiah(item.value.metadata.cabinetFlatCost)} | Foldable: ${formatRupiah(item.value.metadata.cabinetFoldableCost)}`
    })
    rows.push({
      label: 'Power Supply (PSU)',
      value: `${item.value.metadata.psuPcs || 4} Pcs × ${formatRupiah(item.value.metadata.psuUnitPrice)} = ${formatRupiah(item.value.metadata.psuTotalPrice)}`
    })
    rows.push({
      label: 'Receiving Card (RC)',
      value: `${item.value.metadata.rcPcs || 2} Pcs × ${formatRupiah(item.value.metadata.rcUnitPrice)} = ${formatRupiah(item.value.metadata.rcTotalPrice)}`
    })
    rows.push({
      label: 'Kabel (Jumper & Power)',
      value: `Jumper: ${formatRupiah(item.value.metadata.cablesJumper || 200000)} | Power: ${formatRupiah(item.value.metadata.cablesPower || 150000)} (Total ${formatRupiah(item.value.metadata.cablesTotal || 350000)})`
    })
    rows.push({
      label: 'Biaya Perakitan (Assembly)',
      value: formatRupiah(item.value.metadata.assemblyCost || 270000)
    })
    rows.push({
      label: 'Media Player Controller',
      value: `Colorlight A35 (${formatRupiah(item.value.metadata.processorA35Cost)})`
    })
    rows.push({
      label: 'Target Margin Profit',
      value: item.value.metadata.profitMargin || '25.00%'
    })
    if (item.value.metadata.baseCost) {
      rows.push({
        label: 'HPP Modal Dasar Produksi (Base Cost)',
        value: formatRupiah(Number(item.value.metadata.baseCost)),
        isHighlight: true
      })
    }
  } else if (item.value.metadata?.modulePrice) {
    rows.push({ label: 'Estimasi Biaya Modul', value: formatRupiah(item.value.metadata.modulePrice) })
  }
  if (item.value.metadata?.profit && !item.value.metadata?.moduleUnitPrice) {
    rows.push({ label: 'Margin Standar', value: item.value.metadata.profit })
  }
  if (item.value.metadata?.priceKredit) {
    rows.push({ label: 'Harga Skema Kredit (Non-Cash)', value: formatRupiah(item.value.metadata.priceKredit), isHighlight: true })
  }
  if (item.value.metadata?.price5SideFormatted) {
    rows.push({ label: 'Harga Cube 5 Sisi', value: item.value.metadata.price5SideFormatted, isHighlight: true })
  }
  if (item.value.metadata?.cabinet4Side) {
    rows.push({ label: 'Rangka Kabinet Cube 4 Sisi', value: formatRupiah(item.value.metadata.cabinet4Side) })
  }
  if (item.value.metadata?.cabinet5Side) {
    rows.push({ label: 'Rangka Kabinet Cube 5 Sisi', value: formatRupiah(item.value.metadata.cabinet5Side) })
  }
  if (item.value.metadata?.tkdnValue) {
    rows.push({ label: 'Sertifikasi Nilai TKDN Resmi', value: `${item.value.metadata.tkdnValue}%`, isHighlight: true })
  }
  if (item.value.metadata?.scan) {
    rows.push({ label: 'Scan Rate', value: item.value.metadata.scan })
  }
  if (item.value.metadata?.capacity) {
    rows.push({ label: 'Kapasitas / Load Rating', value: item.value.metadata.capacity })
  }
  if (item.value.brochureUrl) {
    rows.push({ label: 'Dokumen Brosur Resmi', value: 'Tersedia (Google Drive PDF)', isHighlight: true })
  }
  if (item.value.videoUrl) {
    rows.push({ label: 'Video Presentasi / Demo', value: 'Tersedia (Tautan YouTube / Demo)', isHighlight: true })
  }
  if (categoryExtra.value?.kursUSD) {
    rows.push({ label: 'Acuan Kurs USD / Nilai Tukar', value: categoryExtra.value.kursUSD })
  }

  return rows
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
    <!-- TOP STICKY APP BAR -->
    <header class="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Back and Breadcrumb -->
        <div class="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            class="rounded-xl gap-2 font-medium text-muted-foreground hover:text-foreground shrink-0 border border-border/50"
            @click="goBack"
          >
            <ArrowLeft class="w-4 h-4" />
            <span class="hidden sm:inline">Kembali</span>
          </Button>

          <!-- Breadcrumbs desktop -->
          <nav class="hidden md:flex items-center gap-2 text-xs text-muted-foreground truncate font-mono">
            <span class="hover:text-foreground cursor-pointer" @click="router.push('/')">Portal</span>
            <ChevronRight class="w-3.5 h-3.5 shrink-0 opacity-40" />
            <span
              class="hover:text-foreground cursor-pointer font-semibold uppercase"
              :class="item?.catalog === 'mvg' ? 'text-amber-500' : 'text-blue-500'"
              @click="goBack"
            >
              {{ item?.catalog === 'mvg' ? 'Pricelist MVG' : 'AV Price List' }}
            </span>
            <ChevronRight class="w-3.5 h-3.5 shrink-0 opacity-40" />
            <span class="hover:text-foreground cursor-pointer truncate" @click="goBack">
              {{ category?.name || 'Katalog' }}
            </span>
            <ChevronRight class="w-3.5 h-3.5 shrink-0 opacity-40" />
            <span class="text-foreground font-semibold truncate">{{ item?.model || 'Detail' }}</span>
          </nav>
        </div>

        <!-- Right Quick Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl gap-1.5 text-xs font-mono border-border/60"
            title="Cetak Rincian / Export PDF"
            @click="printDetail"
          >
            <Printer class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Cetak</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            class="rounded-xl gap-1.5 text-xs font-mono border-border/60"
            @click="copyText(window?.location?.href || '', 'url')"
          >
            <Check v-if="copiedType === 'url'" class="w-3.5 h-3.5 text-emerald-500" />
            <Share2 v-else class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">{{ copiedType === 'url' ? 'Tersalin' : 'Bagikan' }}</span>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- LOADING STATE -->
    <div v-if="isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse mb-4">
        <Sparkles class="w-7 h-7 animate-spin" />
      </div>
      <h3 class="text-lg font-bold text-foreground">Memuat Data Detail Produk...</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm">Mengambil parameter teknis, foto resolusi tinggi, dan simulasi penawaran resmi.</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="errorMessage || !item" class="max-w-xl mx-auto px-4 py-24 text-center">
      <div class="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto mb-4">
        <Info class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-bold text-foreground">Produk Tidak Ditemukan</h2>
      <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
        {{ errorMessage || 'Item katalog yang Anda cari tidak tersedia atau kode SKU tidak sesuai.' }}
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <Button class="rounded-xl gap-2" @click="router.push('/pricelist?catalog=mvg')">
          <ArrowLeft class="w-4 h-4" />
          Ke Katalog MVG
        </Button>
      </div>
    </div>

    <!-- MAIN PRODUCT DETAIL VIEW -->
    <main v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-12 sm:pb-8">
      <!-- HERO GRID: Visual Gallery (Left) & Commercial Info (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- LEFT: VISUAL SHOWCASE & IMAGE GALLERY (5 Columns) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Main Hero Image Frame -->
          <div class="relative group rounded-3xl bg-card border border-border/80 overflow-hidden shadow-xl p-4 sm:p-6 transition-all">
            <!-- Badges top overlay -->
            <div class="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
              <span
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight uppercase shadow-sm"
                :class="item.catalog === 'mvg' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'"
              >
                {{ item.catalog === 'mvg' ? 'PRICELIST MVG' : 'AV PRICE LIST' }}
              </span>
              <span
                v-if="item.type"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight uppercase bg-muted/90 backdrop-blur-md text-foreground border border-border/60 shadow-sm"
              >
                {{ item.type }}
              </span>
            </div>

            <!-- Fullscreen Lightbox Zoom Button -->
            <button
              type="button"
              class="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-background/80 hover:bg-background border border-border/80 text-foreground backdrop-blur-md shadow-md transition-all hover:scale-105"
              title="Perbesar Foto (Lightbox)"
              @click="isLightboxOpen = true"
            >
              <Maximize2 class="w-4 h-4" />
            </button>

            <!-- Image Viewport -->
            <div
              class="w-full aspect-[4/3] rounded-2xl bg-muted/20 flex items-center justify-center overflow-hidden cursor-zoom-in"
              @click="isLightboxOpen = true"
            >
              <img
                :src="currentImage"
                :alt="item.model"
                class="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <!-- Image caption / counter -->
            <div class="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
              <span class="flex items-center gap-1 font-mono text-[11px]">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
                Foto Fisik Pabrikan Resmi
              </span>
              <span v-if="galleryImages.length > 1" class="font-mono text-[11px]">
                Foto {{ activeImageIndex + 1 }} dari {{ galleryImages.length }}
              </span>
            </div>
          </div>

          <!-- Multi-Image Thumbnails Carousel (If > 1 photo) -->
          <div
            v-if="galleryImages.length > 1"
            class="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar"
          >
            <button
              v-for="(img, idx) in galleryImages"
              :key="idx"
              type="button"
              class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden bg-card shrink-0 transition-all p-1"
              :class="activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border/60 hover:border-border opacity-70 hover:opacity-100'"
              @click="activeImageIndex = idx"
            >
              <img :src="img" :alt="`Thumbnail ${idx + 1}`" class="w-full h-full object-contain" />
            </button>
          </div>

          <!-- External Resource Links (Drive PDF, YouTube) -->
          <div class="space-y-2 pt-2">
            <a
              v-if="item.brochureUrl"
              :href="item.brochureUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary transition-all font-semibold text-xs group"
            >
              <div class="flex items-center gap-2.5 truncate">
                <FileDown class="w-4 h-4 shrink-0 text-primary" />
                <span class="truncate">Unduh / Buka Brosur Resmi (Google Drive PDF)</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <a
              v-if="item.videoUrl"
              :href="item.videoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-500 transition-all font-semibold text-xs group"
            >
              <div class="flex items-center gap-2.5 truncate">
                <Video class="w-4 h-4 shrink-0" />
                <span class="truncate">Tonton Video Presentasi / Demonstrasi Produk</span>
              </div>
              <ExternalLink class="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <!-- RIGHT: COMMERCIAL, PRICING, & ORDER ESTIMATOR (7 Columns) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Category & SKU Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag class="w-3.5 h-3.5 text-primary" />
                {{ category?.name || item.category }}
              </span>
              <span class="text-muted-foreground/40">•</span>
              <span class="text-xs font-mono text-muted-foreground">Katalog {{ item.catalog?.toUpperCase() }}</span>
            </div>

            <!-- SKU Copy Badge -->
            <button
              type="button"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/80 hover:bg-muted border border-border/80 text-xs font-mono text-foreground transition-all shadow-sm group"
              title="Klik untuk menyalin SKU"
              @click="copyText(item.sku, 'sku')"
            >
              <span class="font-bold tracking-tight">{{ item.sku }}</span>
              <Check v-if="copiedType === 'sku'" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>

          <!-- Product Title & Headline -->
          <div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {{ item.model }}
            </h1>
            <p v-if="item.description && item.description !== item.model" class="text-sm text-muted-foreground mt-2 leading-relaxed">
              {{ item.description }}
            </p>
          </div>

          <!-- Key Spec Highlights Chips -->
          <div class="flex flex-wrap gap-2 pt-1">
            <div v-if="item.size" class="px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-medium text-foreground flex items-center gap-1.5">
              <span class="text-muted-foreground">Ukuran:</span>
              <span class="font-bold font-mono">{{ item.size }}</span>
            </div>
            <div v-if="item.type" class="px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-medium text-foreground flex items-center gap-1.5">
              <span class="text-muted-foreground">Tipe:</span>
              <span class="font-bold font-mono">{{ item.type }}</span>
            </div>
            <div v-if="item.metadata?.curve" class="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>Kurva:</span>
              <span class="font-bold">{{ item.metadata.curve }}</span>
            </div>
            <div v-if="item.metadata?.tkdnValue" class="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>TKDN Resmi: {{ item.metadata.tkdnValue }}%</span>
            </div>
            <div v-if="categoryExtra?.kursUSD" class="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <TrendingUp class="w-3.5 h-3.5" />
              <span>Kurs USD: {{ categoryExtra.kursUSD }}</span>
            </div>
          </div>

          <!-- PRIMARY PRICING CARD -->
          <div class="rounded-3xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border/90 p-5 sm:p-6 shadow-xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/60 pb-4">
              <div>
                <span class="text-[11px] uppercase font-bold tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <Sparkles class="w-3 h-3" />
                  Harga Cash (Termurah)
                </span>
                <div class="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-1">
                  {{ formatRupiah(item.price) }}
                </div>
              </div>

              <!-- Credit price if available -->
              <div v-if="creditUnitPrice > 0" class="sm:text-right">
                <span class="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Harga Kredit</span>
                <div class="text-xl sm:text-2xl font-bold text-foreground font-mono mt-0.5">
                  {{ formatRupiah(creditUnitPrice) }}
                </div>
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Hemat {{ formatRupiah(creditUnitPrice - item.price) }} via Cash
                </span>
              </div>
            </div>

            <!-- LED Poster Dual Price (if category led_poster) -->
            <div v-if="item.category === 'led_poster'" class="grid grid-cols-2 gap-3 pt-1">
              <div class="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p class="text-[11px] text-muted-foreground font-medium">Versi Cabinet Flat + A35</p>
                <p class="text-lg font-bold text-foreground font-mono mt-0.5">{{ item.priceFormatted }}</p>
              </div>
              <div class="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p class="text-[11px] text-muted-foreground font-medium">Versi Foldable (Lipat) + A35</p>
                <p class="text-lg font-bold text-foreground font-mono mt-0.5">{{ item.metadata?.foldablePriceFormatted || '-' }}</p>
              </div>
            </div>

            <!-- LED Cube Dual Price (if category led_cube) -->
            <div v-if="item.category === 'led_cube'" class="grid grid-cols-2 gap-3 pt-1">
              <div class="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p class="text-[11px] text-muted-foreground font-medium">Versi Cube 4 Sisi (Gantung / Dinding)</p>
                <p class="text-lg font-bold text-foreground font-mono mt-0.5">{{ item.priceFormatted }}</p>
              </div>
              <div class="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p class="text-[11px] text-muted-foreground font-medium">Versi Cube 5 Sisi (Berdiri 360° Display)</p>
                <p class="text-lg font-bold text-foreground font-mono mt-0.5">{{ item.metadata?.price5SideFormatted || '-' }}</p>
              </div>
            </div>

            <!-- INTERACTIVE ORDER ESTIMATOR / CALCULATOR -->
            <div class="pt-2 space-y-3">
              <div class="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                <span class="flex items-center gap-1.5 text-foreground truncate">
                  <Calculator class="w-4 h-4 text-primary shrink-0" />
                  Simulasi Kebutuhan Unit
                </span>
                <span class="shrink-0 text-[11px] font-mono">Subtotal Live</span>
              </div>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <!-- Quantity Stepper -->
                <div class="flex items-center gap-3">
                  <span class="text-xs text-muted-foreground font-medium">Jumlah:</span>
                  <div class="inline-flex items-center border border-border/80 rounded-xl bg-background overflow-hidden shadow-sm">
                    <button
                      type="button"
                      class="px-3.5 py-2 hover:bg-muted text-foreground transition-colors font-bold text-base"
                      @click="orderQty = Math.max(1, orderQty - 1)"
                    >
                      -
                    </button>
                    <input
                      v-model.number="orderQty"
                      type="number"
                      min="1"
                      max="999"
                      class="w-14 text-center font-bold font-mono text-sm bg-transparent border-0 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      class="px-3.5 py-2 hover:bg-muted text-foreground transition-colors font-bold text-base"
                      @click="orderQty = orderQty + 1"
                    >
                      +
                    </button>
                  </div>
                  <span class="text-xs text-muted-foreground">unit</span>
                </div>

                <!-- Total Estimation -->
                <div class="text-right flex flex-col items-end">
                  <div class="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    {{ formatRupiah(totalCash) }}
                  </div>
                  <div v-if="totalKredit > 0" class="text-xs text-muted-foreground font-mono">
                    Total Kredit: {{ formatRupiah(totalKredit) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ACTION BUTTONS: INTERNAL UTILITIES (SALIN PENAWARAN & SPESIFIKASI) -->
            <div class="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                size="lg"
                class="rounded-2xl gap-2 font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                @click="copyQuoteText"
              >
                <Check v-if="copiedType === 'quote'" class="w-4 h-4 text-emerald-300" />
                <Copy v-else class="w-4 h-4" />
                <span>{{ copiedType === 'quote' ? 'Format Penawaran Tersalin!' : 'Salin Format Penawaran' }}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                class="rounded-2xl gap-2 font-bold text-sm border-border/80 hover:bg-muted shadow-xs"
                @click="copyFullSpecs"
              >
                <Check v-if="copiedType === 'specs'" class="w-4 h-4 text-emerald-500" />
                <FileText v-else class="w-4 h-4" />
                <span>{{ copiedType === 'specs' ? 'Spesifikasi Tersalin!' : 'Salin Spesifikasi & SKU' }}</span>
              </Button>
            </div>
          </div>

        </div>
      </div>

      <!-- BOTTOM TABS: Deep Specifications, Official Notes, & Comparison -->
      <section class="space-y-4 pt-6 border-t border-border/80">
        <!-- Segmented Tab Header -->
        <div class="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto no-scrollbar">
          <button
            v-if="item?.category === 'led_poster' || item?.metadata?.moduleUnitPrice"
            type="button"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0"
            :class="activeTab === 'bom' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
            @click="activeTab = 'bom'"
          >
            <Boxes class="w-4 h-4" />
            Rincian Bill of Materials (BOM) &amp; Costing
          </button>

          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0"
            :class="activeTab === 'specs' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
            @click="activeTab = 'specs'"
          >
            <Layers class="w-4 h-4" />
            Spesifikasi Lengkap &amp; Hardware
          </button>

          <button
            v-if="categoryExtra?.notes && categoryExtra.notes.length > 0"
            type="button"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0"
            :class="activeTab === 'terms' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
            @click="activeTab = 'terms'"
          >
            <FileText class="w-4 h-4" />
            Ketentuan &amp; Catatan Resmi ({{ categoryExtra.notes.length }})
          </button>

          <button
            v-if="categoryExtra?.comparisonChart || item.comparisonChart"
            type="button"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0"
            :class="activeTab === 'comparison' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
            @click="activeTab = 'comparison'"
          >
            <TrendingUp class="w-4 h-4" />
            Tabel Komparasi Seri
          </button>
        </div>

        <!-- TAB CONTENT 0: BILL OF MATERIALS (BOM) COSTING BREAKDOWN -->
        <div v-if="activeTab === 'bom' && (item.category === 'led_poster' || item.metadata?.moduleUnitPrice)" class="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-sm space-y-6 p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h3 class="text-base font-bold text-foreground flex items-center gap-2">
                <Boxes class="w-5 h-5 text-primary" />
                Rincian Bill of Materials (BOM) &amp; Kalkulasi Costing Resmi
              </h3>
              <p class="text-xs text-muted-foreground mt-0.5">
                Struktur biaya transparan sesuai standar pabrikan Google Sheets (Ukuran {{ item.size || '64x192cm' }})
              </p>
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
              <span>Target Margin Profit: {{ item.metadata?.profitMargin || '25.00%' }}</span>
            </div>
          </div>

          <!-- Grid 8 Komponen BOM -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 1. Module -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">1. Modul LED Unit</span>
              <p class="text-sm font-bold text-foreground">{{ item.metadata?.modulePcs || 24 }} Pcs × Rp {{ (item.metadata?.moduleUnitPrice || 0).toLocaleString('id-ID') }}</p>
              <p class="text-xs font-mono text-primary font-bold">Total: Rp {{ (item.metadata?.moduleTotalPrice || 0).toLocaleString('id-ID') }}</p>
            </div>

            <!-- 2. Cabinet Iron Flat & Foldable -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">2. Rangka Kabinet Besi</span>
              <div class="text-xs space-y-0.5">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Flat:</span>
                  <span class="font-mono font-bold text-foreground">Rp {{ (item.metadata?.cabinetFlatCost || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Foldable:</span>
                  <span class="font-mono font-bold text-foreground">Rp {{ (item.metadata?.cabinetFoldableCost || 0).toLocaleString('id-ID') }}</span>
                </div>
              </div>
            </div>

            <!-- 3. Power Supply (PSU) -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">3. Power Supply (PSU)</span>
              <p class="text-sm font-bold text-foreground">{{ item.metadata?.psuPcs || 4 }} Pcs × Rp {{ (item.metadata?.psuUnitPrice || 0).toLocaleString('id-ID') }}</p>
              <p class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">Total: Rp {{ (item.metadata?.psuTotalPrice || 0).toLocaleString('id-ID') }}</p>
            </div>

            <!-- 4. Receiving Card (RC) -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">4. Receiving Card (RC)</span>
              <p class="text-sm font-bold text-foreground">{{ item.metadata?.rcPcs || 2 }} Pcs × Rp {{ (item.metadata?.rcUnitPrice || 0).toLocaleString('id-ID') }}</p>
              <p class="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">Total: Rp {{ (item.metadata?.rcTotalPrice || 0).toLocaleString('id-ID') }}</p>
            </div>

            <!-- 5. Cables Jumper & Power -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">5. Kabel Wiring</span>
              <div class="text-xs space-y-0.5">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Jumper:</span>
                  <span class="font-mono font-bold text-foreground">Rp {{ (item.metadata?.cablesJumper || 200000).toLocaleString('id-ID') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Power:</span>
                  <span class="font-mono font-bold text-foreground">Rp {{ (item.metadata?.cablesPower || 150000).toLocaleString('id-ID') }}</span>
                </div>
              </div>
            </div>

            <!-- 6. Assembly Cost -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">6. Biaya Perakitan</span>
              <p class="text-sm font-bold text-foreground font-mono">Rp {{ (item.metadata?.assemblyCost || 270000).toLocaleString('id-ID') }}</p>
              <span class="text-[10px] text-muted-foreground">QC, wiring &amp; test run</span>
            </div>

            <!-- 7. Media Controller Player -->
            <div class="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">7. Controller Player</span>
              <p class="text-sm font-bold text-foreground font-mono">Rp {{ (item.metadata?.processorA35Cost || 0).toLocaleString('id-ID') }}</p>
              <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Colorlight A35 Cloud Player</span>
            </div>

            <!-- 8. Base Cost (HPP Modal) -->
            <div class="p-4 rounded-2xl bg-muted/40 border-2 border-border/80 space-y-1">
              <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">8. HPP Modal Produksi</span>
              <p class="text-sm font-black text-foreground font-mono">
                {{ item.metadata?.baseCost ? 'Rp ' + Number(item.metadata.baseCost).toLocaleString('id-ID') : '-' }}
              </p>
              <span class="text-[10px] text-muted-foreground">Sebelum margin 25%</span>
            </div>
          </div>

          <!-- Final Price Comparison Card -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-card via-muted/30 to-card border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="space-y-1 text-center sm:text-left">
              <span class="text-xs font-bold text-muted-foreground uppercase">Harga Jual Jadi Siap Pakai (Include A35 Player):</span>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1">
                <div class="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span class="text-[10px] font-bold uppercase text-rose-500 block">Cabinet Flat Standar</span>
                  <span class="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{{ item.priceFormatted }}</span>
                </div>
                <div class="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span class="text-[10px] font-bold uppercase text-amber-500 block">Cabinet Foldable (Lipat)</span>
                  <span class="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{{ item.metadata?.foldablePriceFormatted || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="text-xs text-muted-foreground max-w-xs text-center sm:text-right">
              <p class="font-medium text-foreground">Spesifikasi 100% Plug &amp; Play</p>
              <p class="text-[11px] mt-0.5">Sudah termasuk frame kabinet, power supply, kartu kontrol, player, dan kabel jumper/power lengkap.</p>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 1: SPECS MATRIX -->
        <div v-if="activeTab === 'specs'" class="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
              <Cpu class="w-4 h-4 text-primary" />
              Matriks Parameter Teknis &amp; Komponen
            </h3>
            <span class="text-xs text-muted-foreground font-mono">{{ specRows.length }} atribut tercatat</span>
          </div>

          <div class="divide-y divide-border/60 text-xs sm:text-sm font-mono">
            <div
              v-for="(row, idx) in specRows"
              :key="idx"
              class="grid grid-cols-1 sm:grid-cols-12 px-6 py-3.5 hover:bg-muted/30 transition-colors items-center gap-2"
            >
              <div class="sm:col-span-4 text-muted-foreground font-sans font-medium flex items-center gap-2">
                <span>{{ row.label }}</span>
              </div>
              <div
                class="sm:col-span-8 font-semibold break-words"
                :class="row.isHighlight ? 'text-primary' : 'text-foreground'"
              >
                {{ row.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 2: OFFICIAL NOTES & TERMS -->
        <div
          v-else-if="activeTab === 'terms' && categoryExtra?.notes"
          class="rounded-3xl bg-card border border-border/80 p-6 shadow-sm space-y-4"
        >
          <div class="flex items-center gap-2 text-foreground font-bold text-sm">
            <ShieldCheck class="w-5 h-5 text-emerald-500" />
            Catatan Teknis &amp; Ketentuan Standar Mitra Visual Group
          </div>

          <ul class="space-y-2.5">
            <li
              v-for="(note, nIdx) in categoryExtra.notes"
              :key="nIdx"
              class="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans"
            >
              <span class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>{{ note }}</span>
            </li>
          </ul>
        </div>

        <!-- TAB CONTENT 3: COMPARISON CHART -->
        <div
          v-else-if="activeTab === 'comparison'"
          class="rounded-3xl bg-card border border-border/80 p-6 shadow-sm space-y-4 text-center"
        >
          <h3 class="text-sm font-bold text-foreground">Diagram &amp; Tabel Perbandingan Spesifikasi Seri</h3>
          <div class="rounded-2xl border border-border overflow-hidden bg-muted/20 max-w-4xl mx-auto p-2">
            <img
              :src="categoryExtra?.comparisonChart || item.comparisonChart"
              alt="Perbandingan Spesifikasi"
              class="w-full h-auto object-contain rounded-xl"
            />
          </div>
        </div>
      </section>

      <!-- RELATED PRODUCTS / REKOMENDASI ITEM TERKAIT -->
      <section v-if="relatedItems.length > 0" class="space-y-4 pt-6 border-t border-border/80">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-foreground">Produk Terkait dalam Kategori Ini</h3>
            <p class="text-xs text-muted-foreground mt-0.5">Produk sejenis dari {{ category?.name }} untuk perbandingan penawaran.</p>
          </div>
          <Button variant="ghost" size="sm" class="rounded-xl gap-1 text-xs font-semibold self-start sm:self-auto" @click="goBack">
            <span>Lihat Semua</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </Button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="rel in relatedItems"
            :key="rel.id"
            class="group rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg shadow-sm"
            @click="goToItem(rel.id)"
          >
            <div>
              <div class="flex items-center justify-between gap-1 mb-2">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground truncate">{{ rel.sku }}</span>
                <span v-if="rel.type" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted/60 text-foreground">{{ rel.type }}</span>
              </div>

              <div class="w-full aspect-[4/3] rounded-xl bg-muted/20 flex items-center justify-center p-2 mb-3 overflow-hidden">
                <img :src="rel.image" :alt="rel.model" class="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </div>

              <h4 class="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {{ rel.model }}
              </h4>
              <p v-if="rel.size" class="text-[11px] text-muted-foreground font-mono mt-1">{{ rel.size }}</p>
            </div>

            <div class="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span class="text-[9px] uppercase font-bold text-muted-foreground">Harga Cash</span>
                <p class="text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono">{{ rel.priceFormatted }}</p>
              </div>
              <span class="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ArrowRight class="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- FULLSCREEN IMAGE LIGHTBOX MODAL -->
    <div
      v-if="isLightboxOpen"
      class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      @click="isLightboxOpen = false"
    >
      <div class="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center" @click.stop>
        <button
          type="button"
          class="absolute top-2 right-2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          @click="isLightboxOpen = false"
        >
          <X class="w-6 h-6" />
        </button>

        <img
          :src="currentImage"
          :alt="item?.model"
          class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
        />

        <div class="mt-4 text-center text-white">
          <p class="font-bold text-base">{{ item?.model }}</p>
          <p class="text-xs text-white/70 font-mono mt-1">SKU: {{ item?.sku }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  header,
  .print-hidden,
  button {
    display: none !important;
  }
}
</style>
