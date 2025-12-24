<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: '',
    },
    id: String,
    label: String,
    type: {
        type: String,
        default: 'text',
    },
    placeholder: String,
    disabled: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String,
        default: '',
    },
    hint: {
        type: String,
        default: '',
    },
    min: {
        type: [String, Number]
    },
    max: {
        type: [String, Number]
    },
    step: {
        type: [String, Number]
    }
})

const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)

/**
 * Ensure we always have a stable ID for accessibility
 */
const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2)}`)

const hasError = computed(() => Boolean(props.error))

const inputType = computed(() => {
    if (props.type !== 'password') return props.type
    return showPassword.value ? 'text' : 'password'
})

const describedBy = computed(() => {
    if (hasError.value) return `${inputId.value}-error`
    if (props.hint) return `${inputId.value}-hint`
    return undefined
})
</script>

<template>
    <div class="space-y-1">
        <!-- Label -->
        <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ label }}
        </label>

        <!-- Input Wrapper -->
        <div class="relative">
            <input :id="inputId" :type="inputType" :placeholder="placeholder" :value="modelValue" :disabled="disabled"
                :min="min" , :max="max" :aria-invalid="hasError" :aria-describedby="describedBy"
                @input="emit('update:modelValue', $event.target.value)" class="w-full rounded-lg border px-4 py-2.5 pr-11 text-sm transition
               focus:outline-none focus:ring-2
               disabled:opacity-50 disabled:cursor-not-allowed" :class="hasError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 dark:border-gray-800 enabled:hover:border-brand focus:ring-brand'" />

            <!-- Eye Toggle -->
            <button v-if="type === 'password'" type="button" :disabled="disabled" @click="showPassword = !showPassword"
                class="absolute top-1/2 right-3 -translate-1/2 flex items-center justify-center h-fit rounded
               text-gray-500 dark:text-gray-400 
               hover:text-gray-700 dark:hover:text-gray-200
               focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer
               disabled:opacity-50 disabled:cursor-not-allowed"
                :aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'" aria-hidden="true" />
            </button>
        </div>

        <!-- Hint -->
        <p v-if="hint && !hasError" :id="`${inputId}-hint`" class="text-xs text-neutral">
            {{ hint }}
        </p>

        <!-- Error -->
        <p v-else-if="hasError" :id="`${inputId}-error`" class="text-xs text-red-600" role="alert">
            {{ error }}
        </p>
    </div>
</template>
