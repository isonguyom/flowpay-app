<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import DarkModeToggle from '@/components/DarkModeToggle.vue'
import { useUtils } from '@/composables/useUtils'

const route = useRoute()
const { gotoRoute } = useUtils()

// -----------------------------
// State
// -----------------------------
const activeTab = ref('login')

// -----------------------------
// Derived state
// -----------------------------
const year = computed(() => new Date().getFullYear())

// -----------------------------
// Sync tab with route
// -----------------------------
const syncTabWithRoute = () => {
  activeTab.value = route.path.includes('register') ? 'register' : 'login'
}

syncTabWithRoute()
watch(() => route.path, syncTabWithRoute)

// -----------------------------
// Actions
// -----------------------------
const goToLogin = () => {
  activeTab.value = 'login'
  gotoRoute('/login')
}

const goToRegister = () => {
  activeTab.value = 'register'
  gotoRoute('/register')
}
</script>

<template>
  <main
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4"
  >
    <section
      class="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 px-6 py-8 sm:px-8"
      role="region"
      aria-labelledby="auth-title"
    >
      <!-- Brand -->
      <header class="mb-4 text-center">
        <h1 id="auth-title" class="text-3xl font-bold text-brand">
          FlowPay
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cross-border payments made simple
        </p>
      </header>

      <!-- Tabs -->
      <nav
        class="flex justify-center mb-6 border-b border-gray-200 dark:border-gray-700"
        aria-label="Authentication tabs"
      >
        <button
          class="px-4 py-2 -mb-px font-medium text-sm border-b-2"
          :class="activeTab === 'login'
            ? 'border-brand text-brand'
            : 'border-transparent text-gray-500 dark:text-gray-400'"
          @click="goToLogin"
        >
          Login
        </button>

        <button
          class="px-4 py-2 -mb-px font-medium text-sm border-b-2"
          :class="activeTab === 'register'
            ? 'border-brand text-brand'
            : 'border-transparent text-gray-500 dark:text-gray-400'"
          @click="goToRegister"
        >
          Register
        </button>
      </nav>

      <!-- Content -->
      <section>
        <slot :activeTab="activeTab" />
      </section>

      <!-- Footer -->
      <footer
        class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 flex flex-col items-center gap-1"
      >
        <p>© {{ year }} FlowPay</p>
        <DarkModeToggle />
      </footer>
    </section>
  </main>
</template>
