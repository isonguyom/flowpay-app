<template>
  <!-- Accessible, theme-aware toggle button -->
  <button type="button" @click="toggleDarkMode" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer border transition-all duration-200
           border-gray-300 dark:border-gray-700
           text-gray-700 dark:text-gray-100
           hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">

    <!-- Icon dynamically switches based on theme -->
    <span class="text-xl bi" :class="isDark ? 'bi-sun-fill' : ' bi-moon-fill'"></span>
  </button>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

// Destructure reactive theme state and functions
const { isDark, syncDarkMode, toggleDarkMode } = useDarkMode()

// Ensure theme syncs on component mount
onMounted(() => {
  syncDarkMode()
})
</script>

<style scoped></style>
