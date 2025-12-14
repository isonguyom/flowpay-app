<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'

import { useTransactionStore } from '@/stores/transactions'
import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'

const transactionStore = useTransactionStore()

// Fetch transactions on mount
onMounted(() => {
    transactionStore.fetchTransactions()
})
</script>

<template>
    <AppLayout>
        <div class="w-full mx-auto py-6 space-y-6">

            <!-- Page Header -->
            <PageHeader title="Transactions" subtitle="View your payment history" />

            <!-- API Skeleton -->
            <ApiSkeleton :loading="transactionStore.loading" :error="transactionStore.error"
                :items="transactionStore.transactions">
                <template #default="{ items }">
                    <TransactionsGrid :payments="items" />
                </template>
            </ApiSkeleton>

        </div>
    </AppLayout>
</template>
