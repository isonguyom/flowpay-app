<script setup>
const props = defineProps({
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    },
    empty: {
        type: String,
        default: 'No items found.'
    },
    items: {
        type: Array,
        default: () => []
    }
})
</script>

<template>
    <div class="space-y-4">

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-16">
            <svg class="w-10 h-10 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-red-600 text-center py-16 font-medium">
            {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 17v-4h6v4m-6 0V9h6v8M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm md:text-base font-medium">{{ empty }}</p>
        </div>

        <!-- Content -->
        <div v-else>
            <slot :items="items"></slot>
        </div>

    </div>
</template>

<style scoped>
/* Optional smooth transitions */
</style>
