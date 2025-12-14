<script setup>
import { reactive } from 'vue'

const toasts = reactive([])

const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    toasts.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
}

const removeToast = (id) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) toasts.splice(index, 1)
}

// Expose methods
defineExpose({ addToast })
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-8 right-4 flex flex-col gap-2 z-50 max-w-70">
            <div v-for="toast in toasts" :key="toast.id" :class="[
                'px-4 py-2 rounded shadow bg-gray-100 dark:bg-gray-700 border-t transition-all',
                toast.type === 'success' ? 'border-green-500' :
                    toast.type === 'error' ? 'border-red-500' : 'border-gray-700'
            ]">
                {{ toast.message }}
            </div>
        </div>
    </Teleport>
</template>
