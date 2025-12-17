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
        <div class="fixed top-8 right-4 z-50 max-w-xs" aria-live="polite" aria-atomic="true">
            <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
                <div v-for="toast in toasts" :key="toast.id" role="status" :class="[
                    'px-4 py-2 rounded-lg shadow border-l-4 text-sm',
                    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                    toast.type === 'success' && 'border-green-500',
                    toast.type === 'error' && 'border-red-500',
                    toast.type === 'info' && 'border-gray-500'
                ]">
                    {{ toast.message }}
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
/* Enter / leave animation */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.25s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

/* Smooth repositioning */
.toast-move {
    transition: transform 0.25s ease;
}
</style>
