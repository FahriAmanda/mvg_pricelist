<script setup lang="ts">
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-vue-next'

defineProps<{
  open: boolean
  title?: string
  subtitle?: string
}>()
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
            class="relative w-full max-w-sm sm:max-w-md bg-card/95 text-card-foreground rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 overflow-hidden text-center flex flex-col items-center"
          >
            <!-- Background Glow FX -->
            <div class="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Animated Dual Ring Spinner -->
            <div class="relative w-20 h-20 mb-5 flex items-center justify-center">
              <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-40"></div>
              <div class="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin"></div>
              <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <RefreshCw class="w-7 h-7 animate-spin" />
              </div>
            </div>

            <!-- Sync Status Badge -->
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sinkronisasi Realtime</span>
              <Sparkles class="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            </div>

            <!-- Title & Subtitle -->
            <h3 class="text-base sm:text-lg font-black text-foreground tracking-tight">
              {{ title || 'Menyinkronkan Harga & Stok Terkini...' }}
            </h3>
            <p class="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
              {{ subtitle || 'Mengambil pembaruan harga dari Google Sheets & ketersediaan stok gudang ERP real-time...' }}
            </p>

            <!-- Shimmer Loading Bar -->
            <div class="w-full bg-muted/60 h-2 rounded-full mt-6 overflow-hidden relative border border-border/50">
              <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 w-1/2 rounded-full animate-[shimmer_1.5s_infinite] shadow-xs"></div>
            </div>

            <p class="text-[11px] text-muted-foreground/80 mt-3 font-mono">
              Mohon tunggu sebentar...
            </p>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}
</style>
