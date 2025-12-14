<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    id: String,
    label: String,
    placeholder: {
        type: String,
        default: 'Select an option',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: '',
    },
    hint: {
        type: String,
        default: '',
    },
    options: {
        type: Array,
        default: () => [], // array of { label, value }
    },
})

const emit = defineEmits(['update:modelValue'])

/**
 * Ensure we always have a stable ID for accessibility
 */
const selectId = computed(() => props.id || `select-${Math.random().toString(36).slice(2)}`)

const hasError = computed(() => Boolean(props.error))

const describedBy = computed(() => {
    if (hasError.value) return `${selectId.value}-error`
    if (props.hint) return `${selectId.value}-hint`
    return undefined
})
</script>

<template>
    <div class="space-y-1">
        <!-- Label -->
        <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ label }}
        </label>

        <!-- Select Wrapper -->
        <div class="relative">
            <select :id="selectId" :value="modelValue" :disabled="disabled" :aria-invalid="hasError"
                :aria-describedby="describedBy" @change="emit('update:modelValue', $event.target.value)" class="w-full rounded-lg border px-4 py-2.5 text-sm transition
               focus:outline-none focus:ring-2
               disabled:opacity-50 disabled:cursor-not-allowed
               appearance-none"
                :class="[hasError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-800 enabled:hover:border-brand focus:ring-brand', !modelValue ? 'select-placeholder-active' : '']">
                <option value="" disabled hidden>{{ placeholder }}</option>
                <option v-for="option in options" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>

            <!-- Loader -->
            <span v-if="loading" class="absolute inset-y-0 right-3 flex items-center justify-center">
                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4" />
                    <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
            </span>

            <!-- Dropdown Arrow -->
            <span v-else class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <i class="bi bi-chevron-down"></i>
            </span>


        </div>

        <!-- Hint -->
        <p v-if="hint && !hasError" :id="`${selectId}-hint`" class="text-xs text-neutral">
            {{ hint }}
        </p>

        <!-- Error -->
        <p v-else-if="hasError" :id="`${selectId}-error`" class="text-xs text-red-600" role="alert">
            {{ error }}
        </p>
    </div>
</template>


<style scoped>
/* Fallback for browsers that ignore Tailwind on <option> */
:global(select option) {
    background-color: var(--color-light);
    color: var(--color-dark);
}

:global(.dark select option) {
    background-color: #101828;
    color: var(--color-light);
}

/*  placeholder when no value selected */
:global(.select-placeholder-active) {
    color: var(--color-neutral) !important;
}
</style>