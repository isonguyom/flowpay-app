<template>
  <div class="flex items-center gap-x-1 w-fit">
    <!-- System theme button -->
    <button type="button" @click="setTheme('system')" :class="buttonClass(theme === 'system')" title="Use system theme"
      aria-label="Use system theme">
      <span class="bi bi-laptop-fill flex"></span>
    </button>

    <!-- Light theme button -->
    <button type="button" @click="setTheme('light')" :class="buttonClass(theme === 'light')"
      title="Switch to light mode" aria-label="Switch to light mode">
      <span class="bi bi-sun-fill flex"></span>
    </button>

    <!-- Dark theme button -->
    <button type="button" @click="setTheme('dark')" :class="buttonClass(theme === 'dark')" title="Switch to dark mode"
      aria-label="Switch to dark mode">
      <span class="bi bi-moon-fill flex"></span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive theme state: 'system' | 'light' | 'dark'
const theme = ref('system')

// Apply the theme to the document
const applyTheme = (value) => {
  const root = document.documentElement
  if (value === 'system') {
    // Follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', value === 'dark')
  }
}

// Set theme and save to localStorage
const setTheme = (value) => {
  theme.value = value
  localStorage.setItem('theme', value)
  applyTheme(value)
}

// On mount, restore saved theme or default to system
onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark' || saved === 'system') theme.value = saved
  applyTheme(theme.value)
})

// Watch system changes if theme is set to 'system'
if (window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (theme.value === 'system') applyTheme('system')
  })
}

// Dynamic button classes
const buttonClass = (active) => `
  flex items-center justify-center rounded transition-all duration-200 text-xs w-5 h-5  hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer
  ${active ? 'text-gray-600 dark:text-gray-300 border-gray-600 dark:border-gray-300' : 'border-gray-400 dark:border-gray-500 text-gray-400 dark:text-gray-500'}
  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary
`
</script>

<style scoped></style>
