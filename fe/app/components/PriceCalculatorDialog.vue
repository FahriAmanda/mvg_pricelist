<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import { Calculator, Sparkles, Check } from '@lucide/vue'
import AutoForm from '@/components/ui/auto-form/AutoForm.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { PricelistItem } from '~/types/pricelist'

const props = defineProps<{
  open: boolean
  item?: PricelistItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const calculationResult = ref<{
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  discountPercent: number
  discountAmount: number
  marginPercent: number
  marginAmount: number
  grandTotal: number
} | null>(null)

// Dynamic default values based on selected item
const defaultName = computed(() => {
  if (props.item) {
    return props.item.description || props.item.model || props.item.sku
  }
  return 'Module P3.0 Pro Indoor'
})

const defaultPrice = computed(() => {
  if (props.item && props.item.price > 0) {
    return props.item.price
  }
  return 235000
})

// AutoForm Zod Schema
const dynamicSchema = computed(() => {
  return z.object({
    namaProduk: z.string().min(2, { message: 'Nama produk minimal 2 karakter' }).default(defaultName.value),
    hargaSatuan: z.number().min(1, { message: 'Harga minimal Rp 1' }).default(defaultPrice.value),
    jumlahKebutuhan: z.number().min(1, { message: 'Minimal 1 unit' }).default(20),
    tipeAplikasi: z.enum(['Indoor Display', 'Outdoor Videotron', 'Rental Staging', 'Commercial Signage']).default('Indoor Display'),
    diskonPersen: z.number().min(0).max(100).default(5),
    marginProfit: z.number().min(0).max(100).default(15),
    catatanProyek: z.string().optional()
  })
})

const fieldConfig = {
  namaProduk: {
    label: 'Nama Komponen / SKU',
    description: 'Nama komponen atau item dari katalog Asia Visiotron'
  },
  hargaSatuan: {
    label: 'Harga Satuan (Rp)',
    description: 'Harga per pcs atau per meter dari pricelist'
  },
  jumlahKebutuhan: {
    label: 'Jumlah Unit / Qty',
    description: 'Total kebutuhan fisik untuk instalasi'
  },
  tipeAplikasi: {
    label: 'Kategori / Lokasi Pemasangan',
    description: 'Tipe instalasi untuk proyek'
  },
  diskonPersen: {
    label: 'Diskon Penjualan (%)',
    description: 'Potongan harga jika ada'
  },
  marginProfit: {
    label: 'Margin Keuntungan (%)',
    description: 'Target margin kotor proyek'
  },
  catatanProyek: {
    label: 'Catatan Khusus (Opsional)',
    description: 'Informasi tambahan untuk penawaran atau SPK'
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      calculationResult.value = null
    }
  }
)

function handleSubmit(values: any) {
  const harga = Number(values.hargaSatuan) || 0
  const qty = Number(values.jumlahKebutuhan) || 1
  const diskon = Number(values.diskonPersen) || 0
  const margin = Number(values.marginProfit) || 0

  const subtotal = harga * qty
  const discountAmount = subtotal * (diskon / 100)
  const afterDiscount = subtotal - discountAmount
  const marginAmount = afterDiscount * (margin / 100)
  const grandTotal = afterDiscount + marginAmount

  calculationResult.value = {
    productName: values.namaProduk,
    unitPrice: harga,
    quantity: qty,
    subtotal,
    discountPercent: diskon,
    discountAmount,
    marginPercent: margin,
    marginAmount,
    grandTotal
  }
}

function formatIdr(num: number) {
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-primary/10 text-primary">
            <Calculator class="w-5 h-5" />
          </div>
          <div>
            <DialogTitle class="text-lg font-bold">Simulasi Estimasi & Penawaran</DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
              Form Otomatis Shadcn-Vue untuk menghitung estimasi kebutuhan unit dan kalkulasi margin harga.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="mt-4 space-y-6">
        <!-- Shadcn AutoForm Component -->
        <div class="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-sm">
          <AutoForm
            :key="item?.id || 'new-calc'"
            :schema="dynamicSchema"
            :field-config="fieldConfig"
            @submit="handleSubmit"
          >
            <div class="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" size="sm" @click="emit('update:open', false)">
                Batal
              </Button>
              <Button type="submit" size="sm" class="gap-2">
                <Sparkles class="w-4 h-4" />
                <span>Hitung Estimasi</span>
              </Button>
            </div>
          </AutoForm>
        </div>

        <!-- Calculation Result Card -->
        <div
          v-if="calculationResult"
          class="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Check class="w-3.5 h-3.5" />
              </span>
              <h4 class="font-semibold text-sm">Ringkasan Estimasi Harga</h4>
            </div>
            <Badge variant="outline" class="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              Kalkulasi Siap
            </Badge>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p class="text-muted-foreground">Komponen</p>
              <p class="font-medium truncate">{{ calculationResult.productName }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Jumlah Kebutuhan</p>
              <p class="font-medium">{{ calculationResult.quantity }} Unit</p>
            </div>
            <div>
              <p class="text-muted-foreground">Harga Satuan</p>
              <p class="font-medium">{{ formatIdr(calculationResult.unitPrice) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Subtotal Dasar</p>
              <p class="font-medium">{{ formatIdr(calculationResult.subtotal) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Diskon ({{ calculationResult.discountPercent }}%)</p>
              <p class="font-medium text-amber-500">- {{ formatIdr(calculationResult.discountAmount) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Margin ({{ calculationResult.marginPercent }}%)</p>
              <p class="font-medium text-blue-500">+ {{ formatIdr(calculationResult.marginAmount) }}</p>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-between">
            <span class="text-sm font-semibold text-foreground">Total Estimasi Akhir:</span>
            <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatIdr(calculationResult.grandTotal) }}
            </span>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
