<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'
import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'

import { useTransactionStore } from '@/stores/transactions'

const transactionStore = useTransactionStore()

// Fetch transactions when component mounts
onMounted(() => {
    transactionStore.fetchTransactions()
})
</script>

<template>
    <AppLayout>
        <div class="w-full mx-auto py-6 space-y-6">

            <!-- Page Header -->
            <PageHeader title="Transactions" subtitle="View your payment history" />

            <!-- Transactions with API Skeleton -->
            <ApiSkeleton :loading="transactionStore.loading" :error="transactionStore.error"
                :items="transactionStore.transactions" empty="No transactions available">
                <template #default="{ items }">
                    <TransactionsGrid :transactions="items" />
                </template>
            </ApiSkeleton>

        </div>
    </AppLayout>
</template>
