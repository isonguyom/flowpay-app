<script setup>
import { onMounted, ref } from 'vue'
import { getHealth } from '@/services/health'

const status = ref('Checking backend...')

onMounted(async () => {
  try {
    const res = await getHealth()
    status.value = res.data.status
  } catch (err) {
    status.value = 'Backend not reachable'
  }
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold">Backend Status</h1>
    <p class="mt-2">{{ status }}</p>

    <a href="/login">Login</a>
  </div>
</template>
