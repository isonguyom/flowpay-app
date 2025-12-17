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
    items: {
        type: Array,
        default: () => []
    }
})
</script>

<template>
    <div class="space-y-4">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center py-8">
            <svg class="w-8 h-8 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-red-600 text-center py-8">
            {{ error }}
        </div>

        <!-- Empty state -->
        <div v-else-if="!items.length" class="text-gray-500 text-center py-8">
            No items found.
        </div>

        <!-- Content state -->
        <div v-else>
            <slot :items="items"></slot>
        </div>
    </div>
</template>

<style scoped>
/* Optional: smooth transitions */
</style>
