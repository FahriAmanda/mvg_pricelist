<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import ThemeToggle from '~/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(() => {
  // If user was logged out due to expired session, display reason
  if (authStore.logoutReason) {
    errorMessage.value = authStore.logoutReason
  }
})

async function handleLogin() {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Silakan isi username dan password Anda.'
    return
  }

  isLoading.value = true

  try {
    await authStore.login(username.value, password.value)

    // Redirect to requested path or root
    const redirectPath = (route.query.redirect as string) || '/'
    router.push(redirectPath)
  } catch (err: any) {
    errorMessage.value = err.message || 'Login gagal. Periksa username dan password Anda.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col justify-between antialiased selection:bg-primary/20">
    <!-- Top Corner Controls -->
    <header class="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-8 rounded-lg bg-card border border-border/70 p-1 flex items-center shadow-xs">
          <img
            src="/mvg-header-logo.png"
            alt="MVG Logo"
            class="h-full w-auto object-contain dark:brightness-110"
            onerror="this.onerror=null; this.src='/mvg-logo.png';"
          />
        </div>
        <span class="text-xs font-bold font-mono tracking-wider text-muted-foreground uppercase">
          PRICELIST PORTAL
        </span>
      </div>

      <ThemeToggle />
    </header>

    <!-- Center Login Card -->
    <main class="flex-1 flex items-center justify-center px-4 py-8">
      <div
        v-motion
        :initial="{ opacity: 0, y: 20, scale: 0.98 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }"
        class="w-full max-w-md rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        <!-- Top Gradient Ambient Bar -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-orange-500"></div>

        <!-- Brand & Heading -->
        <div class="text-center space-y-2 mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1 shadow-xs">
            <Lock class="w-7 h-7 text-amber-500" />
          </div>

          <Badge variant="outline" class="text-[10px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 uppercase px-2.5 py-0.5">
            AKUN MY MVG / MVG BISNIS
          </Badge>

          <h1 class="text-2xl font-black tracking-tight text-foreground uppercase">
            MASUK KE PRICELIST
          </h1>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Masuk menggunakan akun <strong>MY MVG / MVG BISNIS</strong> Anda. Seluruh akun terdaftar dapat mengakses katalog harga resmi.
          </p>
        </div>

        <!-- Alert Notification Banner -->
        <div
          v-if="errorMessage"
          v-motion
          :initial="{ opacity: 0, height: 0 }"
          :enter="{ opacity: 1, height: 'auto', transition: { duration: 200 } }"
          class="mb-5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="flex-1 leading-snug">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Login Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Username Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground uppercase tracking-wide block">
              Username
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <User class="w-4 h-4" />
              </div>
              <input
                v-model="username"
                type="text"
                placeholder="Masukkan username Anda"
                autocomplete="username"
                required
                class="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border/80 bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground uppercase tracking-wide block">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukkan kata sandi"
                autocomplete="current-password"
                required
                class="w-full h-11 pl-10 pr-10 rounded-xl border border-border/80 bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            class="w-full h-11 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md gap-2 transition-all mt-2"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <LogIn v-else class="w-4 h-4" />
            <span>{{ isLoading ? 'Memverifikasi Sesi...' : 'Masuk ke Sistem' }}</span>
          </Button>
        </form>

        <!-- Security & Auto Logout Note -->
        <div class="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
          <div class="flex items-center gap-1.5">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-500" />
            <span>Sesi Terenkripsi MY MVG / MVG BISNIS</span>
          </div>
          <span class="font-mono">Auto-Sync Active</span>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 text-center text-xs text-muted-foreground border-t border-border/60">
      <p>© 2026 Mitra Visual Group (MVG) & Asia Visiotron. All rights reserved.</p>
    </footer>
  </div>
</template>
