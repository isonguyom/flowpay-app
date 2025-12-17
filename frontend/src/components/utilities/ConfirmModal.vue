<script setup>
import BaseButton from '@/components/utilities/BaseButton.vue'

defineProps({
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm Action' },
    loading: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog"
                aria-modal="true" aria-labelledby="modal-title">
                <div class="bg-white dark:bg-gray-900
                           rounded-xl p-6 w-96 space-y-4
                           shadow-lg">
                    <h3 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ title }}
                    </h3>

                    <div class="text-gray-700 dark:text-gray-300">
                        <slot>
                            Are you sure you want to continue?
                        </slot>
                    </div>

                    <div class="flex justify-end space-x-2">
                        <BaseButton variant="outline" @click="$emit('close')">
                            Cancel
                        </BaseButton>

                        <BaseButton :loading="loading" @click="$emit('confirm')">
                            Confirm
                        </BaseButton>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Overlay fade */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Modal scale */
.modal-enter-active .bg-white,
.modal-leave-active .bg-white,
.modal-enter-active .dark\:bg-gray-900,
.modal-leave-active .dark\:bg-gray-900 {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-enter-from .dark\:bg-gray-900 {
    transform: scale(0.95);
    opacity: 0;
}

.modal-leave-to .bg-white,
.modal-leave-to .dark\:bg-gray-900 {
    transform: scale(0.95);
    opacity: 0;
}
</style>
