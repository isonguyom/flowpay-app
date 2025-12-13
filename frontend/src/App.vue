<script setup>
import { onMounted } from 'vue';

import DarkModeToggle from '@/components/DarkModeToggle.vue';

import { useDarkMode } from '@/composables/useDarkMode';

const { syncDarkMode } = useDarkMode()
onMounted(() => {
  syncDarkMode()
})
</script>
<template>
  <header>
    <div class="fixed right-3 bottom-3 z-50">
      <DarkModeToggle />
    </div>
  </header>

  <RouterView />
</template>

<style scoped></style>
