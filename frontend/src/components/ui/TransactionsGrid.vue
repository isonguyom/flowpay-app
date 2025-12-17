<script setup>
import TransactionCard from '@/components/cards/TransactionCard.vue'

defineProps({
    transactions: {
        type: Array,
        default: () => [],
    },
})
</script>

<template>
    <div class="w-full overflow-x-auto scrollbar-none
           rounded-xl border border-gray-200 dark:border-gray-800
           bg-white dark:bg-gray-900
           divide-y divide-gray-200 dark:divide-gray-800">
        <!-- Transactions -->
        <TransactionCard v-for="trx in transactions" :key="trx.id" :transaction="trx" />
    </div>
</template>
