<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// -----------------------------
// Stores & Route
// -----------------------------
const authStore = useAuthStore()
const route = useRoute()

// -----------------------------
// Navigation items
// -----------------------------
const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
    { name: 'Payment', path: '/payment', icon: 'bi-credit-card-fill' },
    { name: 'Transactions', path: '/transactions', icon: 'bi-receipt' },
    { name: 'Settings', path: '/settings', icon: 'bi-gear' },
]

// -----------------------------
// Navigation helpers
// -----------------------------
const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`)
const pageTitle = computed(() => route.meta.title || 'Dashboard')

// Ref to nav container for mobile scroll behavior
const navRef = ref(null)

// Scroll the active link into view on route change
const scrollActiveIntoView = () => {
    nextTick(() => {
        if (!navRef.value) return
        const activeLink = navRef.value.querySelector('[aria-current="page"]')
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center' })
        }
    })
}

// Watch for route changes to scroll active tab
watch(() => route.path, () => scrollActiveIntoView())
</script>

<template>
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div class="px-4 pt-4 pb-2 flex items-center justify-between">
                <!-- Brand -->
                <h1 class="text-2xl font-bold text-brand">FlowPay</h1>

                <!-- User Info -->
                <div class="flex items-center gap-3">
                    <!-- Avatar -->
                    <div class="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold"
                        aria-hidden="true">
                        {{ authStore.user?.name?.charAt(0) || 'U' }}
                    </div>

                    <!-- Name & Email -->
                    <div class="hidden sm:flex flex-col">
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
            <nav ref="navRef" class="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
                aria-label="Primary navigation">
                <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition shrink-0"
                    :class="isActive(item.path)
                        ? 'bg-brand/10 text-brand'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
                    :aria-current="isActive(item.path) ? 'page' : undefined">
                    <i :class="`bi ${item.icon}`" class="text-base" aria-hidden="true" />
                    {{ item.name }}
                </RouterLink>
            </nav>
        </header>

        <!-- Main Content -->
        <main class="flex-1 p-4 sm:p-6" :aria-labelledby="pageTitle">
            <slot />
        </main>
    </div>
</template>
