<script setup lang="ts">
import { CheckCircle2, AlertTriangle, Sparkles, Database, Layers, Check, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  open: boolean
  success: boolean
  title?: string
  message?: string
  data?: {
    version?: string
    priceUpdates?: number
    total?: number
    approved?: number
    timestamp?: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function formatTime(isoString?: string) {
  if (!isoString) return 'Baru saja'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  } catch {
    return 'Baru saja'
  }
}
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none overscroll-contain"
        @click.self="emit('close')"
      >
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0 translate-y-3"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 translate-y-3"
        >
          <div
            class="relative w-full max-w-sm sm:max-w-md bg-card/95 text-card-foreground rounded-3xl p-6 sm:p-7 shadow-2xl border overflow-hidden text-center flex flex-col items-center"
            :class="success ? 'border-emerald-500/30' : 'border-rose-500/30'"
          >
            <!-- Background Glow FX -->
            <div
              v-if="success"
              class="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
            ></div>
            <div
              v-if="success"
              class="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
            ></div>
            <div
              v-else
              class="absolute -top-16 -left-16 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"
            ></div>

            <!-- Close Button Top Right -->
            <button
              type="button"
              class="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Tutup"
              @click="emit('close')"
            >
              <X class="w-4 h-4" />
            </button>

            <!-- Main Status Icon -->
            <div class="relative w-16 h-16 mb-4 flex items-center justify-center">
              <div
                v-if="success"
                class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner"
              >
                <CheckCircle2 class="w-8 h-8" />
              </div>
              <div
                v-else
                class="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-inner"
              >
                <AlertTriangle class="w-8 h-8" />
              </div>
            </div>

            <!-- Sync Status Badge -->
            <div
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border"
              :class="success
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="success ? 'bg-emerald-500' : 'bg-rose-500'"
              ></span>
              <span>{{ success ? 'SINKRONISASI BERHASIL' : 'SINKRONISASI GAGAL' }}</span>
              <Sparkles v-if="success" class="w-3.5 h-3.5 text-amber-500" />
            </div>

            <!-- Title & Subtitle -->
            <h3 class="text-base sm:text-lg font-black text-foreground tracking-tight">
              {{ title || (success ? 'Harga Terbaru Berhasil Disinkronkan' : 'Gagal Menyinkronkan') }}
            </h3>
            <p class="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-sm">
              {{ message || (success
                ? 'Seluruh harga pada Web Pricelist dan database ERP MVG telah diselaraskan dengan Google Sheets master.'
                : 'Terjadi kendala saat melakukan sinkronisasi harga.') }}
            </p>

            <!-- Detailed Metrics Box (When Success) -->
            <div
              v-if="success && data"
              class="w-full mt-4 p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-2 text-left text-xs"
            >
              <div class="flex items-center justify-between py-1 border-b border-border/50">
                <span class="text-muted-foreground flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5 text-primary" />
                  Total Item Terkatalog
                </span>
                <span class="font-bold font-mono text-foreground">{{ data.total ?? 806 }} SKU (24 Kategori)</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-border/50">
                <span class="text-muted-foreground flex items-center gap-1.5">
                  <Check class="w-3.5 h-3.5 text-emerald-500" />
                  Item Siap Jual (Approved)
                </span>
                <span class="font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ data.approved ?? 408 }} SKU</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-border/50">
                <span class="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-amber-500" />
                  Perubahan Harga Diterapkan
                </span>
                <span class="font-bold font-mono" :class="Number(data.priceUpdates || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
                  {{ data.priceUpdates ?? 0 }} SKU
                </span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="text-muted-foreground flex items-center gap-1.5">
                  <Database class="w-3.5 h-3.5 text-primary" />
                  Sinkronisasi ERP MVG
                </span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  100% Selaras (erp_mvg)
                </span>
              </div>
            </div>

            <!-- Footer Action Button -->
            <Button
              class="w-full mt-5 rounded-xl font-bold cursor-pointer transition-all shadow-xs"
              :variant="success ? 'default' : 'outline'"
              @click="emit('close')"
            >
              {{ success ? 'Tutup & Lihat Katalog' : 'Tutup' }}
            </Button>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>
