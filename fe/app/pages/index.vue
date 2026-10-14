<script setup lang="ts">
import { ref } from 'vue'
import {
  Boxes,
  Tv,
  Box,
  Plug,
  Zap,
  Server,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  ChevronRight,
  Clock,
  ArrowRight,
  Lock,
  RefreshCw
} from '@lucide/vue'
import { usePricelist } from '~/composables/usePricelist'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const {
  categories,
  stats,
  isLiveConnected,
  lastSyncTime,
  isSyncing,
  triggerSync
} = usePricelist()

// Categories ordered strictly matching Image 2
const gateCategories = [
  {
    id: 'led_cube',
    title: 'LED CUBE',
    desc: 'Display Kubus 4 Sisi & 5 Sisi 32x32cm Lengkap Part Rakitan',
    icon: Boxes,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
  },
  {
    id: 'led_poster',
    title: 'LED POSTER',
    desc: 'Standing LED Poster Flat & Foldable Portable Inc. A35 Player',
    icon: Tv,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  {
    id: 'cabinet',
    title: 'CABINET',
    desc: 'Cabinet Iron, Die-cast Aluminium, Curve & Rental Series',
    icon: Box,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  },
  {
    id: 'psu',
    title: 'POWER SUPPLY',
    desc: 'Power Supply 200W, 300W, 400W 4.5V / 5V (Lampro, Meanwell)',
    icon: Plug,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
  },
  {
    id: 'novastar',
    title: 'NOVASTAR',
    desc: 'Receiving Cards DH7508, DH7512, MRV, Sending Cards & Processor',
    icon: Zap,
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  },
  {
    id: 'huidu',
    title: 'HUIDU',
    desc: 'Asynchronous Player A3L, A4L, Video Processor & Controller',
    icon: Server,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
  },
  {
    id: 'colorlight',
    title: 'COLORLIGHT',
    desc: 'Receiving Cards E80, 5A-75E, Cloud Player A35 & Video Processor',
    icon: Sparkles,
    color: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20'
  },
  {
    id: 'magnustek_tkdn',
    title: 'TKDN MAGNUSTEK MODULE',
    desc: 'LED Videotron Resmi Bersertifikasi TKDN Kemenperin (34% - 43%)',
    icon: ShieldCheck,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'lampro',
    title: 'LAMPRO LED MODULE',
    desc: 'Modul LED Lampro Indoor & Outdoor P1.2 hingga P4 Pro Series',
    icon: Layers,
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20'
  },
  {
    id: 'qiangli',
    title: 'QIANG LI LED MODULE',
    desc: 'Modul LED QiangLi Indoor, Outdoor & Flexible Series P1.2 - P10',
    icon: Cpu,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  }
]

function getCategoryCount(catId: string) {
  const found = categories.value.find((c) => c.id === catId)
  return found ? found.itemCount : 0
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
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
    <!-- Top Sticky Minimal Bar -->
    <header
      v-motion
      :initial="{ opacity: 0, y: -15 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 350, ease: 'easeOut' } }"
      class="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md"
    >
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="flex items-center justify-center h-10 rounded-xl bg-card border border-border/60 shadow-xs px-2 py-1 overflow-hidden">
            <img
              src="/mvg-header-logo.png"
              alt="Mitra Visual Group"
              class="h-full w-auto object-contain dark:brightness-110"
              onerror="this.onerror=null; this.src='/mvg-logo.png';"
            />
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              PORTAL HARGA
            </span>
            <span class="text-sm font-black tracking-tight text-foreground uppercase">
              MITRA VISUAL GROUP
            </span>
          </div>
        </div>

        <!-- Right Controls -->
        <div class="flex items-center gap-2">
          <!-- Live Status -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/70 text-[11px] text-muted-foreground bg-muted/30"
            title="Real-time SSE Active"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span class="font-mono text-[10px] hidden xs:inline">{{ formatTime(lastSyncTime) }}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 p-0 border-border/70 text-muted-foreground hover:text-foreground"
            :disabled="isSyncing"
            title="Refresh Data"
            @click="triggerSync()"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin text-primary': isSyncing }" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Gate Hero & Cards -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 space-y-8">
      <!-- Welcome Hero Banner -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 18 }"
        :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24, delay: 80 } }"
        class="text-center space-y-2"
      >
        <Badge variant="outline" class="text-[11px] font-semibold border-primary/30 text-primary bg-primary/5 uppercase px-3 py-1">
          Katalog Harga Resmi & Terintegrasi
        </Badge>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          PILIH KATALOG PRICE LIST
        </h1>
        <p class="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Silakan pilih menu katalog harga di bawah untuk membuka data teknis dan perhitungan estimasi kebutuhan proyek.
        </p>
      </div>

      <!-- PRICELIST SECTIONS -->
      <section class="space-y-4">
        <!-- 1. PRICELIST MVG CARD -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 140 } }"
          :hovered="{ y: -2, scale: 1.008, transition: { type: 'spring', stiffness: 400, damping: 25 } }"
          :tapped="{ scale: 0.99 }"
          class="p-4 sm:p-4.5 rounded-2xl border border-primary/40 bg-card hover:bg-muted/20 shadow-xs flex items-center justify-between gap-3 transition-colors cursor-default"
        >
          <div class="flex items-center gap-3 sm:gap-4 min-w-0">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border shadow-xs shrink-0 text-primary bg-primary/10 border-primary/20">
              <Sparkles class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div>
              <h3 class="font-black text-sm sm:text-base text-foreground uppercase tracking-tight">
                PRICELIST MVG
              </h3>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold text-muted-foreground bg-muted border border-border/70">
            Incoming
          </span>
        </div>

        <!-- SEPARATOR: AV PRICE LIST -->
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.96 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 300, delay: 200 } }"
          class="pt-3 pb-1 flex items-center gap-3"
        >
          <div class="h-4 w-1 bg-primary rounded-full"></div>
          <h2 class="text-xs sm:text-sm font-black tracking-wider text-foreground uppercase">
            AV PRICE LIST
          </h2>
          <div class="flex-1 h-px bg-border/80"></div>
          <span class="text-[11px] font-bold text-muted-foreground font-mono">10 Kategori</span>
        </div>

        <!-- 2. 10 ASIA VISIOTRON CATEGORIES (PERSIS GAMBAR 2) -->
        <div class="space-y-2.5">
          <NuxtLink
            v-for="(cat, idx) in gateCategories"
            :key="cat.id"
            :to="`/pricelist?category=${cat.id}`"
            v-motion
            :initial="{ opacity: 0, y: 20, scale: 0.98 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 280,
                damping: 24,
                delay: 240 + (idx * 40)
              }
            }"
            :hovered="{
              y: -3,
              scale: 1.012,
              transition: { type: 'spring', stiffness: 400, damping: 25 }
            }"
            :tapped="{ scale: 0.985 }"
            class="group block p-4 sm:p-4.5 rounded-2xl border border-border/80 bg-card hover:bg-muted/30 shadow-xs hover:shadow-md hover:border-primary/50 transition-colors"
          >
            <div class="flex items-center justify-between gap-3">
              <!-- Left: Number + Icon + Title + Description -->
              <div class="flex items-center gap-3 sm:gap-4 min-w-0">
                <!-- Index Number -->
                <span class="w-6 text-xs font-bold font-mono text-muted-foreground/60 group-hover:text-primary transition-colors text-center shrink-0">
                  {{ idx + 1 }}
                </span>

                <!-- Category Icon -->
                <div
                  class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border shadow-xs shrink-0 transition-transform group-hover:scale-105"
                  :class="cat.color"
                >
                  <component :is="cat.icon" class="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </div>

                <!-- Title & Description -->
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-black text-sm sm:text-base text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">
                      {{ cat.title }}
                    </h3>
                  </div>
                  <p class="text-[11px] text-muted-foreground truncate hidden sm:block mt-0.5">
                    {{ cat.desc }}
                  </p>
                </div>
              </div>

              <!-- Right: Count Badge & Arrow -->
              <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-muted text-foreground border border-border/70 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                  {{ getCategoryCount(cat.id) }} item
                </span>
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                  <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Bottom Action Button -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 15 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 650, duration: 350 } }"
          class="pt-4 text-center"
        >
          <NuxtLink to="/pricelist" class="inline-block w-full sm:w-auto">
            <Button
              v-motion
              :hovered="{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 20 } }"
              :tapped="{ scale: 0.98 }"
              size="lg"
              class="w-full sm:w-auto h-12 px-8 rounded-2xl gap-2 font-bold text-sm shadow-md shadow-primary/20"
            >
              <span>Buka Seluruh Katalog Hardware</span>
              <ArrowRight class="w-4 h-4" />
            </Button>
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-border/80 bg-background/60 py-5 text-center text-xs text-muted-foreground px-4">
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="font-medium">© 2026 Mitra Visual Group (MVG). All rights reserved.</p>
        <div class="flex items-center gap-2">
          <span>Sinkronisasi Otomatis Google Sheets</span>
          <span>•</span>
          <span class="font-mono">Live 60s SSE</span>
        </div>
      </div>
    </footer>
  </div>
</template>
