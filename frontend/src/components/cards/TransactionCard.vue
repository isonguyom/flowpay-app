<script setup>
import { computed } from 'vue'

import { useUtils } from '@/composables/useUtils'
import { useHelpers } from '@/composables/useHelpers'

const props = defineProps({
    transaction: {
        type: Object,
        required: true,
    },
})

const { formatCurrencyCompact, formatDate } = useUtils()
const { getStatusClass } = useHelpers()

// ----------------------------
// Computed meta for display
// ----------------------------
const meta = computed(() => {
    const trx = props.transaction
    const base = {
        type: trx.type,
        date: formatDate(trx.createdAt),
        status: trx.status,
    }

    switch (trx.type) {
        case 'FUND':
            return {
                ...base,
                title: `${trx.sourceCurrency} Wallet Funding`,
                subtitle: trx.fundingAccount || 'External Account',
                amount: formatCurrencyCompact(trx.amount, trx.sourceCurrency),
            }

        case 'WITHDRAW':
            return {
                ...base,
                title: `${trx.sourceCurrency} Wallet Withdrawal`,
                subtitle: trx.recipient || 'External Recipient',
                amount: formatCurrencyCompact(trx.amount, trx.sourceCurrency),
            }

        default: // PAYMENT
            return {
                ...base,
                title: `${trx.sourceCurrency} → ${trx.destinationCurrency} Payment`,
                subtitle: trx.beneficiary || 'Unknown',
                amount: `${formatCurrencyCompact(trx.amount, trx.sourceCurrency)} → ${formatCurrencyCompact(trx.settlementAmount, trx.destinationCurrency)}`,
            }
    }
})
</script>

<template>
    <div
        class="p-2 sm:p-4 flex justify-between gap-4 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-950/20 rounded-md">
        <!-- Left -->
        <div class="min-w-0 flex-1">
            <p class="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 flex flex-wrap gap-x-1">
                <span class="uppercase">{{ meta.title }}</span>
                <span class="text-gray-500 font-normal">
                    <span class="hidden md:inline text-xs">•</span>
                    {{ meta.subtitle }}
                </span>
            </p>
            <p class="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {{ meta.date }}
            </p>
        </div>

        <!-- Right -->
        <div class="text-right shrink-0">
            <p class="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ meta.amount }}
            </p>
            <p class="text-xs md:text-sm font-medium" :class="getStatusClass(meta.status)">
                {{ meta.status }}
            </p>
        </div>
    </div>
</template>
