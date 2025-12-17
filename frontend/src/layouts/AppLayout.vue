<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// Initial entry loader
const isInitializing = ref(true)

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
  { name: 'Payment', path: '/payment', icon: 'bi-credit-card-fill' },
  { name: 'Transactions', path: '/transactions', icon: 'bi-receipt' },
  { name: 'Settings', path: '/settings', icon: 'bi-gear' },
]

const isActive = (path) =>
  route.path === path || route.path.startsWith(`${path}/`)

const pageTitle = computed(() => route.meta.title || 'Dashboard')

// Resolve auth on first entry
onMounted(async () => {
  try {
    // Restore user session if token exists
    if (authStore.token && !authStore.user) {
      await authStore.fetchMe?.()
    }
  } finally {
    isInitializing.value = false
  }
})
</script>

<template>
  <!-- Initial Loader -->
  <div
    v-if="isInitializing"
    class="fixed inset-0 z-50 flex items-center justify-center
           bg-white dark:bg-gray-950"
  >
    <div class="flex flex-col items-center gap-3">
      <div class="h-10 w-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Loading FlowPay…
      </p>
    </div>
  </div>

  <!-- App Layout -->
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
    <!-- Header -->
    <header
      class="sticky top-0 z-20 bg-white dark:bg-gray-900
             border-b border-gray-200 dark:border-gray-800"
    >
      <div class="px-4 pt-4 pb-0">
        <!-- Top Row -->
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-brand">
            FlowPay
          </h1>

          <!-- User -->
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-full bg-brand/10 text-brand
                     flex items-center justify-center text-sm font-bold"
              aria-hidden="true"
            >
              {{ authStore.user?.name?.charAt(0) || 'U' }}
            </div>

            <div class="hidden sm:block">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
                {{ authStore.user?.name || '—' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ authStore.user?.email || '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav
          class="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-2"
          aria-label="Primary navigation"
        >
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 whitespace-nowrap
                   px-3 py-1.5 rounded-lg text-sm font-medium transition"
            :class="isActive(item.path)
              ? 'bg-brand/10 text-brand'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            <i :class="`bi ${item.icon}`" class="text-base" aria-hidden="true" />
            {{ item.name }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main -->
    <main class="p-4 sm:p-6 flex-1">
      <slot />
    </main>
  </div>
</template>
