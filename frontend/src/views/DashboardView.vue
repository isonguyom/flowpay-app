<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'

import { useTransactionStore } from '@/stores/transactions'
import { useWalletStore } from '@/stores/wallets'
import { useUtils } from '@/composables/useUtils'
import PageHeader from '@/components/ui/PageHeader.vue'
import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'
import WalletGrid from '@/components/ui/WalletGrid.vue'

const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const { gotoRoute } = useUtils()

// ------------------------
// Actions (mock for now)
// ------------------------
const openDepositModal = (wallet) => {
    console.log('Deposit into wallet:', wallet)
}

const openWithdrawModal = (wallet) => {
    console.log('Withdraw from wallet:', wallet)
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(() => {
    walletStore.fetchWallets()
    transactionStore.fetchTransactions()
})
</script>

<template>
    <AppLayout>
        <div class="space-y-8">
            <!-- Header -->
            <div class="flex items-center justify-between flex-wrap gap-4">
                <PageHeader title="Overview" subtitle=" Monitor funding wallets and cross-border settlements" />

                <BaseButton @click="gotoRoute('/payment')">
                    Make Payment
                </BaseButton>
            </div>

            <!-- Funding Wallets -->
            <section>
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Funding Wallets
                </h3>

                <ApiSkeleton :loading="walletStore.loading" :error="walletStore.error" :items="walletStore.wallets">
                    <template #default="{ items }">
                        <WalletGrid :wallets="items" />
                    </template>
                </ApiSkeleton>
            </section>

            <!-- Fx performance -->
            <section>
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fx performance
                </h3>
                <div class="w-full bg-white dark:bg-gray-800 p-6 mt-3">
                    FX Chart
                </div>
            </section>

            <!-- Recent Payments -->
            <section>
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Recent Payments
                    </h3>

                    <RouterLink to="/transactions" class="text-sm text-brand hover:underline">
                        View all
                    </RouterLink>
                </div>

                <ApiSkeleton :loading="transactionStore.loading" :error="transactionStore.error"
                    :items="transactionStore.transactions">
                    <template #default="{ items }">
                        <TransactionsGrid :payments="items" />
                    </template>
                </ApiSkeleton>
            </section>
        </div>
    </AppLayout>
</template>
