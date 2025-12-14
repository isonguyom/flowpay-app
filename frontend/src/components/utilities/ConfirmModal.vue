<script setup>
import BaseButton from '@/components/utilities/BaseButton.vue'

const props = defineProps({
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm Action' },
    loading: { type: Boolean, default: false },
})

const emits = defineEmits(['close', 'confirm'])
</script>

<template>
    <Teleport to="body">
        <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50" role="dialog"
            aria-modal="true" aria-labelledby="modal-title">
            <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-96 space-y-4 shadow-lg">
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ title }}
                </h3>

                <div class="text-gray-700 dark:text-gray-300">
                    <slot>
                        Are you sure you want to continue?
                    </slot>
                </div>

                <div class="flex justify-end space-x-2">
                    <BaseButton variant="outline" @click="$emit('close')">Cancel</BaseButton>
                    <BaseButton :loading="loading" @click="$emit('confirm')">Confirm</BaseButton>
                </div>
            </div>
        </div>
    </Teleport>
</template>
