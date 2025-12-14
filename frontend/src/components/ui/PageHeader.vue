<script setup>
const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    subtitle: {
        type: String,
        default: '',
    },
})
</script>

<template>
    <div class="space-y-1">
        <h2 v-if="title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {{ title }}
        </h2>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
            {{ subtitle }}
        </p>
    </div>
</template>
