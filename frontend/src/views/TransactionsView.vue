<script setup>
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

import TransactionsList from '@/components/TransactionsList.vue'



</script>


<template>
    <AppLayout>
        <div class="w-full py-6 space-y-6">

            <!-- Page Header -->
            <PageHeader title="Transactions" subtitle="View all your transactions history" />

            <TransactionsList ref="transactionsListRef" />

        </div>
    </AppLayout>
</template>
