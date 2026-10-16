<script setup lang="ts">
import { computed } from 'vue'
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ExternalLink,
  Info,
  PackageCheck,
  AlertCircle
} from 'lucide-vue-next'
import { useCart } from '~~/app/composables/useCart'

const cart = useCart()

function handleProceed() {
  const result = cart.proceedToErpSalesQuotation()
  if (result.error) {
    alert(result.error)
    return
  }
  if (result.url) {
    window.location.href = result.url
  }
}
</script>

<template>
  <div>
    <!-- 1. FLOATING CART BUTTON (BOTTOM RIGHT) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-12 opacity-0 scale-90"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-12 opacity-0 scale-90"
    >
      <div
        v-if="cart.totalCount.value > 0 && !cart.isCartOpen.value"
        class="fixed bottom-6 right-6 z-40"
      >
        <button
          type="button"
          class="group flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl hover:shadow-emerald-500/25 border border-emerald-400/40 transition-all active:scale-95 cursor-pointer"
          @click="cart.openCart()"
        >
          <div class="relative">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart class="w-5 h-5 text-white" />
            </div>
            <span
              class="absolute -top-1.5 -right-1.5 px-2 py-0.5 min-w-[20px] text-center text-[11px] font-black font-mono rounded-full bg-amber-400 text-stone-900 border-2 border-emerald-600 shadow-xs"
            >
              {{ cart.totalCount.value }}
            </span>
          </div>

          <div class="text-left pr-1">
            <div class="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Draf SQ Retail</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            </div>
            <div class="text-sm font-black font-mono">
              {{ cart.totalPriceFormatted.value }}
            </div>
          </div>

          <div class="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight class="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
    </transition>

    <!-- 2. SLIDE-OVER CART DRAWER -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="cart.isCartOpen.value"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overscroll-contain"
          @click.self="cart.closeCart()"
        >
          <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <transition
              enter-active-class="transform transition ease-out duration-300"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition ease-in duration-200"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div
                class="w-screen max-w-md bg-card text-card-foreground border-l border-border/80 shadow-2xl flex flex-col overscroll-contain"
                @click.stop
              >
                <!-- Drawer Header -->
                <div class="p-4 sm:p-5 border-b border-border/70 bg-muted/20 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <ShoppingCart class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-bold text-foreground">Keranjang Penawaran</h3>
                        <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          {{ cart.totalCount.value }} item
                        </span>
                      </div>
                      <p class="text-xs text-muted-foreground">Persiapan Draf Sales Quotation ERP</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      v-if="cart.cartItems.value.length > 0"
                      type="button"
                      class="px-2.5 py-1 text-xs text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Kosongkan Keranjang"
                      @click="cart.clearCart()"
                    >
                      Kosongkan
                    </button>
                    <button
                      type="button"
                      class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      @click="cart.closeCart()"
                    >
                      <X class="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <!-- Info Box: Tipe Transaksi Retail -->
                <div class="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-start gap-2.5">
                  <PackageCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>TIPE TRANSAKSI: RETAIL</span>
                      <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono">Terkunci</span>
                    </div>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">
                      Barang di keranjang ini akan langsung dioper ke Form Sales Quotation ERP tanpa ada yang bolong.
                    </p>
                  </div>
                </div>

                <!-- Drawer Body: List of Items -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar overscroll-contain">
                  <div
                    v-if="cart.cartItems.value.length === 0"
                    class="py-16 text-center space-y-3 text-muted-foreground"
                  >
                    <div class="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground/60">
                      <ShoppingCart class="w-8 h-8" />
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm font-bold text-foreground">Keranjang Masih Kosong</p>
                      <p class="text-xs max-w-xs mx-auto">
                        Pilih produk yang bertanda <span class="font-semibold text-emerald-600">● SYNC ERP</span> pada katalog pricelist untuk ditambahkan ke penawaran.
                      </p>
                    </div>
                  </div>

                  <div
                    v-else
                    v-for="item in cart.cartItems.value"
                    :key="item.sku"
                    class="p-3 rounded-xl border border-border/80 bg-background/60 hover:border-emerald-500/40 transition-all flex flex-col gap-2.5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {{ item.sku }}
                          </span>
                          <span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                            SYNC ERP
                          </span>
                        </div>
                        <h4 class="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                          {{ item.model }}
                        </h4>
                        <div class="text-[11px] font-mono text-muted-foreground">
                          @ {{ item.priceFormatted }}
                        </div>
                      </div>

                      <button
                        type="button"
                        class="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Hapus item"
                        @click="cart.removeFromCart(item.sku)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Quantity Stepper & Subtotal Row -->
                    <div class="flex items-center justify-between pt-2 border-t border-border/50">
                      <div class="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/60">
                        <button
                          type="button"
                          class="w-6 h-6 rounded flex items-center justify-center bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                          @click="cart.decrementQty(item.sku)"
                        >
                          <Minus class="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          :value="item.qty"
                          class="w-10 text-center text-xs font-bold font-mono bg-transparent text-foreground border-none focus:outline-none"
                          @change="(e) => cart.updateQty(item.sku, Number((e.target as HTMLInputElement).value))"
                        />
                        <button
                          type="button"
                          class="w-6 h-6 rounded flex items-center justify-center bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                          @click="cart.incrementQty(item.sku)"
                        >
                          <Plus class="w-3 h-3" />
                        </button>
                      </div>

                      <div class="text-right">
                        <span class="text-[10px] text-muted-foreground block">Subtotal</span>
                        <span class="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          Rp {{ Math.round(item.price * item.qty).toLocaleString('id-ID') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Drawer Footer: Checkout to ERP SQ Form -->
                <div class="p-4 sm:p-5 border-t border-border/80 bg-muted/20 space-y-3">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total Jumlah Unit</span>
                      <span class="font-mono font-bold text-foreground">{{ cart.totalCount.value }} Unit</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="font-bold text-foreground">Total Estimasi SQ</span>
                      <span class="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {{ cart.totalPriceFormatted.value }}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    :disabled="cart.cartItems.value.length === 0"
                    class="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]"
                    @click="handleProceed"
                  >
                    <span>Lanjutkan ke Form SQ ERP</span>
                    <ArrowRight class="w-4 h-4" />
                  </button>

                  <p class="text-[10.5px] text-center text-muted-foreground">
                    Sistem akan membuka form Sales Quotation ERP dengan seluruh item dan harga yang sudah terisi.
                  </p>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
