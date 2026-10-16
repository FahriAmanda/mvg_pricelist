<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ChevronDown, Check, X, Search } from 'lucide-vue-next'

interface OptionItem {
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options?: (string | OptionItem)[]
    label?: string
    placeholder?: string
    displayField?: string
    valueField?: string
    clearable?: boolean
    searchable?: boolean
    disabled?: boolean
    dropdownMinWidth?: number
    size?: 'sm' | 'default' | 'lg'
    class?: string
  }>(),
  {
    modelValue: '',
    options: () => [],
    label: '',
    placeholder: 'Pilih...',
    displayField: 'label',
    valueField: 'value',
    clearable: false,
    searchable: undefined,
    disabled: false,
    dropdownMinWidth: 200,
    size: 'default',
    class: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isMobile = ref(false)

function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 640
  }
}

// Normalize options to uniform array of { value, label, raw }
const normalizedOptions = computed(() => {
  return (props.options || []).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        value: String(opt),
        label: String(opt),
        raw: opt
      }
    }
    const val = opt[props.valueField] !== undefined
      ? opt[props.valueField]
      : (opt.id !== undefined ? opt.id : opt.value)
    
    const lbl = opt[props.displayField] !== undefined
      ? opt[props.displayField]
      : (opt.name !== undefined ? opt.name : (opt.label !== undefined ? opt.label : String(val)))

    return {
      value: String(val ?? ''),
      label: String(lbl ?? ''),
      raw: opt
    }
  })
})

// Auto-determine searchability if not specified
const isSearchable = computed(() => {
  if (props.searchable !== undefined) return props.searchable
  return normalizedOptions.value.length > 7
})

// Filtered options based on search query
const filteredOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return normalizedOptions.value
  return normalizedOptions.value.filter((opt) =>
    opt.label.toLowerCase().includes(q)
  )
})

// Current selected item
const currentOption = computed(() => {
  const currentValStr = String(props.modelValue ?? '')
  return normalizedOptions.value.find((opt) => opt.value === currentValStr)
})

// Display text in trigger
const displayText = computed(() => {
  if (currentOption.value) {
    return currentOption.value.label
  }
  if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '') {
    return String(props.modelValue)
  }
  return props.placeholder
})

function toggleDropdown() {
  if (props.disabled) return
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

function openDropdown() {
  checkMobile()
  isOpen.value = true
  searchQuery.value = ''
  nextTick(() => {
    if (isSearchable.value && searchInputRef.value) {
      searchInputRef.value.focus()
    }
  })
}

function closeDropdown() {
  isOpen.value = false
  searchQuery.value = ''
}

function selectOption(option: { value: string; label: string; raw: any }) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

function handleClear(e: Event) {
  e.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
  closeDropdown()
}

// Click outside handler
function handleClickOutside(e: MouseEvent) {
  if (isMobile.value) return // Handled by backdrop on mobile
  const target = e.target as Node
  if (containerRef.value && !containerRef.value.contains(target)) {
    closeDropdown()
  }
}

// Escape key handler
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('pointerdown', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile)
  }
  document.removeEventListener('pointerdown', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-block w-full text-left font-sans select-none" :class="props.class">
    <!-- Optional Top Label -->
    <label v-if="props.label" class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
      {{ props.label }}
    </label>

    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="props.disabled"
      class="w-full flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-left shadow-2xs hover:bg-muted/30"
      :class="[
        props.size === 'sm' ? 'h-9 px-3 text-xs' : props.size === 'lg' ? 'h-12 px-4 text-base' : 'h-10 px-3 text-xs sm:text-sm',
        isOpen ? 'border-primary ring-2 ring-primary/30' : ''
      ]"
      @click="toggleDropdown"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <slot name="prefix" />
        <span
          class="truncate"
          :class="[!currentOption && !props.modelValue ? 'text-muted-foreground font-normal' : 'font-medium text-foreground']"
        >
          {{ displayText }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0 text-muted-foreground">
        <!-- Clear Button -->
        <span
          v-if="props.clearable && (props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined)"
          role="button"
          tabindex="-1"
          class="p-0.5 rounded-full hover:bg-muted hover:text-foreground transition-colors"
          @click="handleClear"
        >
          <X class="w-3.5 h-3.5" />
        </span>

        <!-- Chevron Down Indicator -->
        <ChevronDown
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180 text-primary': isOpen }"
        />
      </div>
    </button>

    <!-- 1. MOBILE BOTTOM SHEET (Zero Overleap, Thumb-Friendly, Teleported to Body) -->
    <Teleport to="body">
      <div v-if="isOpen && isMobile" class="fixed inset-0 z-[999] flex flex-col justify-end">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          @click="closeDropdown"
        />

        <!-- Slide-up Bottom Sheet Drawer -->
        <div
          class="relative z-[1000] w-full max-h-[82vh] bg-card text-card-foreground rounded-t-3xl border-t border-border/80 shadow-2xl flex flex-col p-4 animate-in slide-in-from-bottom duration-250 ease-out"
        >
          <!-- Pull bar handle -->
          <div class="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />

          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div>
              <h4 class="text-sm font-bold text-foreground">
                {{ props.label || props.placeholder || 'Pilih Opsi' }}
              </h4>
              <p class="text-[11px] text-muted-foreground">
                {{ filteredOptions.length }} pilihan tersedia
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              @click="closeDropdown"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Search Input Bar (if searchable) -->
          <div v-if="isSearchable" class="pt-3 pb-2 shrink-0">
            <div class="relative flex items-center">
              <Search class="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                placeholder="Ketik untuk mencari..."
                class="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                @keydown.stop
              />
            </div>
          </div>

          <!-- Mobile Options List (Thumb-friendly 48px row targets) -->
          <div class="overflow-y-auto no-scrollbar py-2 space-y-1.5 flex-1 overscroll-contain">
            <div
              v-if="filteredOptions.length === 0"
              class="py-8 text-center text-xs text-muted-foreground"
            >
              {{ searchQuery ? 'Tidak ada hasil yang cocok' : 'Tidak ada pilihan' }}
            </div>

            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              type="button"
              class="w-full min-h-[48px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left border cursor-pointer active:scale-[0.99]"
              :class="[
                opt.value === String(props.modelValue)
                  ? 'bg-primary text-primary-foreground font-bold border-primary shadow-sm'
                  : 'bg-muted/30 hover:bg-muted text-foreground border-transparent'
              ]"
              @click="selectOption(opt)"
            >
              <span class="truncate flex-1">{{ opt.label }}</span>
              <Check
                v-if="opt.value === String(props.modelValue)"
                class="w-4 h-4 shrink-0 text-primary-foreground"
              />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 2. DESKTOP FLOATING DROPDOWN (Clamped Width, No Screen Bleed) -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen && !isMobile"
        ref="dropdownRef"
        class="absolute left-0 z-50 mt-1.5 rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl overflow-hidden focus:outline-none max-w-[calc(100vw-32px)]"
        :style="{ minWidth: `${Math.max(props.dropdownMinWidth, 160)}px` }"
      >
        <!-- Search Input Bar (if searchable) -->
        <div v-if="isSearchable" class="p-2 border-b border-border/60 bg-muted/20">
          <div class="relative flex items-center">
            <Search class="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Cari..."
              class="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg border border-border/70 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              @keydown.stop
            />
          </div>
        </div>

        <!-- Options Scrollable List -->
        <div class="max-h-60 overflow-y-auto no-scrollbar p-1.5 space-y-0.5 overscroll-contain">
          <div
            v-if="filteredOptions.length === 0"
            class="py-4 text-center text-xs text-muted-foreground"
          >
            {{ searchQuery ? 'Tidak ada hasil yang cocok' : 'Tidak ada pilihan' }}
          </div>

          <button
            v-for="opt in filteredOptions"
            :key="opt.value"
            type="button"
            class="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer"
            :class="[
              opt.value === String(props.modelValue)
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-foreground hover:bg-muted/80'
            ]"
            @click="selectOption(opt)"
          >
            <span class="truncate">{{ opt.label }}</span>
            <Check
              v-if="opt.value === String(props.modelValue)"
              class="w-3.5 h-3.5 shrink-0 text-primary-foreground"
            />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
