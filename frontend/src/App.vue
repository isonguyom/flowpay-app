<script setup>
import { onMounted } from 'vue';


import { useDarkMode } from '@/composables/useDarkMode';

const { syncDarkMode } = useDarkMode()
onMounted(() => {
  syncDarkMode()
})
</script>
<template>

  <RouterView />
</template>

<style scoped></style>
