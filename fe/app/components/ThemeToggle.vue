<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :title="colorMode.value === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'"
    @click="toggleTheme"
  >
    <Sun
      v-if="colorMode.value === 'dark'"
      class="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100"
    />
    <Moon
      v-else
      class="w-4 h-4 text-slate-700 transition-transform duration-300 rotate-0 scale-100"
    />
    <span class="sr-only">Toggle theme</span>
  </button>
</template>
