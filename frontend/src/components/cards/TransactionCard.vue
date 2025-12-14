<script setup>
import { useUtils } from '@/composables/useUtils'
import { useHelpers } from '@/composables/useHelpers'

const props = defineProps({
    payment: {
        type: Object,
        required: true,
    },
})

const {
    formatCurrencyCompact,
    formatDate
} = useUtils()

const { getStatusClass } = useHelpers()
</script>

<template>
    <div class="p-4 flex justify-between gap-4 transition-opacity hover:opacity-80">
        <!-- Left -->
        <div class="min-w-0">
            <p class="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200
               flex flex-col md:flex-row gap-x-1">
                <span>{{ payment.from }} → {{ payment.to }}</span>
                <span class="text-gray-500 font-normal">
                    <span class="hidden md:inline">•</span>
                    {{ payment.beneficiary }}
                </span>
            </p>

            <p class="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(payment.date) }}
            </p>
        </div>

        <!-- Right -->
        <div class="text-right shrink-0">
            <p class="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                {{ formatCurrencyCompact(payment.amount, payment.from) }}
                →
                {{ formatCurrencyCompact(payment.settlementAmount, payment.to) }}
            </p>

            <p class="text-xs md:text-sm" :class="getStatusClass(payment.status)">
                {{ payment.status }}
            </p>
        </div>
    </div>
</template>
