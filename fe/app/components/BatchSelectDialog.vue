<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Layers,
  Warehouse,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-vue-next'
import type { PricelistItem, ErpBatchItem } from '~~/types/pricelist'

const props = defineProps<{
  open: boolean
  item: PricelistItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm', payload: {
    item: PricelistItem
    qty: number
    batch: ErpBatchItem | null
  }): void
}>()

const selectedBatchKey = ref<string>('')
const qty = ref<number>(1)

// Batches with available_stock > 0 ONLY
const availableBatches = computed<ErpBatchItem[]>(() => {
  if (!props.item || !Array.isArray(props.item.batches)) return []
  return props.item.batches.filter(b => Number(b.available_stock || 0) > 0)
})

// Current selected batch object
const selectedBatch = computed<ErpBatchItem | null>(() => {
  if (availableBatches.value.length === 0) return null
  return availableBatches.value.find(b => getBatchKey(b) === selectedBatchKey.value) || availableBatches.value[0] || null
})

// Maximum quantity allowed based on selected batch
const maxAllowedQty = computed<number>(() => {
  if (selectedBatch.value) {
    return Math.max(1, Number(selectedBatch.value.available_stock || 1))
  }
  return Math.max(1, Number(props.item?.availableStock || 999999))
})

// Subtotal calculation
const subtotalFormatted = computed<string>(() => {
  if (!props.item) return 'Rp 0'
  const total = (Number(props.item.price) || 0) * (Number(qty.value) || 1)
  return 'Rp ' + Math.round(total).toLocaleString('id-ID')
})

function getBatchKey(b: ErpBatchItem): string {
  return `${b.batch_number}__${b.m_gudang_id || b.nama_gudang || ''}`
}

function selectBatch(b: ErpBatchItem) {
  selectedBatchKey.value = getBatchKey(b)
  if (qty.value > maxAllowedQty.value) {
    qty.value = maxAllowedQty.value
  }
}

function increment() {
  if (qty.value < maxAllowedQty.value) {
    qty.value += 1
  }
}

function decrement() {
  if (qty.value > 1) {
    qty.value -= 1
  }
}

function handleQtyInput(e: Event) {
  const target = e.target as HTMLInputElement
  let val = Math.floor(Number(target.value) || 1)
  if (val < 1) val = 1
  if (val > maxAllowedQty.value) val = maxAllowedQty.value
  qty.value = val
  target.value = String(val)
}

function handleClose() {
  emit('update:open', false)
}

function handleConfirm() {
  if (!props.item) return
  emit('confirm', {
    item: props.item,
    qty: qty.value,
    batch: selectedBatch.value
  })
  emit('update:open', false)
}

// Reset selection whenever item changes or dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.item) {
      qty.value = 1
      if (availableBatches.value.length > 0) {
        selectedBatchKey.value = getBatchKey(availableBatches.value[0])
      } else {
        selectedBatchKey.value = ''
      }
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && item"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain"
        @click.self="handleClose"
      >
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            class="w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl border border-border/80 flex flex-col max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Dialog Header -->
            <div class="p-4 sm:p-5 border-b border-border/70 bg-muted/20 flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                  <Layers class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-base font-bold text-foreground leading-tight">
                    Pilih Batch & Kuantitas
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {{ item.sku }}
                    </span>
                    <span class="text-xs font-semibold text-foreground line-clamp-1">
                      {{ item.model }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Dialog Body -->
            <div class="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">
              <!-- Available Stock Summary Banner -->
              <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Warehouse class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Total Stok Gudang Tersedia
                  </span>
                </div>
                <span class="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {{ (item.availableStock || 0).toLocaleString('id-ID') }} Unit
                </span>
              </div>

              <!-- Batch Selection List -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span>Pilih Batch Gudang (Tersedia)</span>
                    <span class="text-[10px] font-normal text-muted-foreground">
                      ({{ availableBatches.length }} batch)
                    </span>
                  </label>
                  <span class="text-[11px] text-muted-foreground">Wajib pilih batch</span>
                </div>

                <!-- If Batches Available -->
                <div
                  v-if="availableBatches.length > 0"
                  class="space-y-2 max-h-52 overflow-y-auto pr-1"
                >
                  <div
                    v-for="b in availableBatches"
                    :key="getBatchKey(b)"
                    class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
                    :class="[
                      selectedBatchKey === getBatchKey(b)
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-border/70 hover:border-border hover:bg-muted/40 bg-card'
                    ]"
                    @click="selectBatch(b)"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        :class="[
                          selectedBatchKey === getBatchKey(b)
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-muted-foreground/40'
                        ]"
                      >
                        <div
                          v-if="selectedBatchKey === getBatchKey(b)"
                          class="w-1.5 h-1.5 rounded-full bg-white"
                        ></div>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono text-xs font-bold text-foreground">
                            {{ b.batch_number }}
                          </span>
                          <span
                            v-if="b.nama_gudang"
                            class="text-[10.5px] px-2 py-0.2 rounded-full bg-muted font-medium text-muted-foreground"
                          >
                            {{ b.nama_gudang }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                        ● {{ b.available_stock.toLocaleString('id-ID') }} Unit
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Fallback If No Batches in DB -->
                <div
                  v-else
                  class="p-3.5 rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground text-center"
                >
                  Item ini tidak memiliki rincian nomor batch terpisah di gudang lokal. Item akan masuk sebagai penawaran reguler.
                </div>
              </div>

              <!-- Quantity Stepper -->
              <div class="p-3.5 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-foreground uppercase tracking-wider">
                    Jumlah Unit (Qty)
                  </span>
                  <span class="text-[11px] text-muted-foreground">
                    Maks. <strong class="text-foreground">{{ maxAllowedQty.toLocaleString('id-ID') }} Unit</strong>
                  </span>
                </div>

                <div class="flex items-center justify-between gap-4 pt-1">
                  <div class="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border/80 shadow-xs">
                    <button
                      type="button"
                      class="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      :disabled="qty <= 1"
                      @click="decrement"
                    >
                      <Minus class="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      :max="maxAllowedQty"
                      :value="qty"
                      class="w-16 text-center text-sm font-black font-mono bg-transparent text-foreground border-none focus:outline-none"
                      @change="handleQtyInput"
                    />

                    <button
                      type="button"
                      class="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      :disabled="qty >= maxAllowedQty"
                      @click="increment"
                    >
                      <Plus class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="text-right">
                    <span class="text-[11px] text-muted-foreground block">Subtotal</span>
                    <span class="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {{ subtotalFormatted }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dialog Footer -->
            <div class="p-4 sm:p-5 border-t border-border/70 bg-muted/20 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                @click="handleClose"
              >
                Batal
              </button>

              <button
                type="button"
                class="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
                @click="handleConfirm"
              >
                <ShoppingCart class="w-4 h-4" />
                <span>Tambahkan ke Keranjang ({{ qty }} Unit)</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>
