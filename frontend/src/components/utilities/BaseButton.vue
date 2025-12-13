<script setup>
import { computed } from 'vue'

const props = defineProps({
    type: {
        type: String,
        default: 'button',
    },
    variant: {
        type: String,
        default: 'solid', // solid | outline | ghost | soft
    },
    size: {
        type: String,
        default: 'md', // sm | md | lg
    },
    loading: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    fullWidth: {
        type: Boolean,
        default: false,
    },
})

const isDisabled = computed(() => props.disabled || props.loading)

const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

const variantClasses = computed(() => {
    switch (props.variant) {
        case 'outline':
            return `
        border border-brand text-brand
        hover:bg-brand/5
        focus-visible:ring-brand
      `
        case 'ghost':
            return `
        text-gray-700 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus-visible:ring-gray-400
      `
        case 'soft':
            return `
        bg-brand/10 text-brand
        hover:bg-brand/15
        focus-visible:ring-brand
      `
        default: // solid
            return `
        bg-brand text-white
        hover:bg-brand/90
        focus-visible:ring-brand
      `
    }
})

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'px-3 py-1.5 text-sm'
        case 'lg':
            return 'px-6 py-3 text-base'
        default:
            return 'px-4 py-2.5 text-sm'
    }
})
</script>

<template>
    <button :type="type" :disabled="isDisabled" class="relative" :class="[
        baseClasses,
        variantClasses,
        sizeClasses,
        fullWidth && 'w-full',
    ]" :aria-busy="loading">
        <!-- Loader -->
        <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4" />
                <path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
        </span>

        <!-- Content -->
        <span :class="{ 'opacity-0': loading }">
            <slot />
        </span>
    </button>
</template>
