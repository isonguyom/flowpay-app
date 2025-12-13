<script setup>
import { onMounted } from 'vue';

import DarkModeToggle from '@/components/utilities/DarkModeToggle.vue';

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

    <div class="wrapper">
      <h1 class="text-3xl font-bold underline text-brand">
        Hello world!
      </h1>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped></style>
