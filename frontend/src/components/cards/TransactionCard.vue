<script setup>
import { computed } from 'vue'
import { useUtils } from '@/composables/useUtils'



const props = defineProps({
    payment: {
        type: Object,
        required: true,
        default: () => ({
            from: '',
            to: '',
            beneficiary: '',
            date: '',
            amount: 0,
            settlementAmount: 0,
            status: '',
        }),
    },
})

const { formatNumber, formatDate, formatCurrency } = useUtils()
// ------------------------
// Computed helpers
// ------------------------
const statusClass = computed(() => {
    switch (props.payment.status) {
        case 'Settled':
            return 'text-green-600'
        case 'Pending':
            return 'text-yellow-600'
        case 'Failed':
            return 'text-red-600'
        default:
            return 'text-gray-500'
    }
})

const formattedSettlementAmount = computed(() =>
    Number(props.payment.settlementAmount || 0).toLocaleString()
)
</script>

<template>
    <div class="p-4 flex items-center justify-between">
        <!-- Left: Payment Details -->
        <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ payment.from }} → {{ payment.to }}
                <span class="text-gray-500 font-normal">
                    • {{ payment.beneficiary }}
                </span>
            </p>

            <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(payment.date) }}
            </p>
        </div>

        <!-- Right: Amount & Status -->
        <div class="text-right">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ formatCurrency(payment.amount, payment.from) }}
                →
                {{ formatCurrency(payment.settlementAmount, payment.to) }}
            </p>

            <p class="text-xs" :class="statusClass">
                {{ payment.status }}
            </p>
        </div>
    </div>
</template>
