<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import WalletList from '@/components/WalletList.vue'
import TotalWalletBalanceCard from '@/components/cards/TotalWalletBalanceCard.vue'
import FxChart from '@/components/charts/FxChart.vue'
import TransactionsList from '@/components/TransactionsList.vue'

import FundWalletModal from '@/components/modals/FundWalletModal.vue'
import WithdrawWalletModal from '@/components/modals/WithdrawWalletModal.vue'

import { useWalletStore } from '@/stores/wallets'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore } from '@/stores/auth'
import { useUtils } from '@/composables/useUtils'

// -------------------- Stores & Utils --------------------
const walletStore = useWalletStore()
const transactionStore = useTransactionStore()
const authStore = useAuthStore()
const { gotoRoute } = useUtils()

const { user } = storeToRefs(authStore)

// -------------------- State --------------------
const showFundModal = ref(false)
const showWithdrawModal = ref(false)
const selectedWallet = ref(null)

const walletListRef = ref(null)
const transactionsListRef = ref(null)
const toastRef = ref(null)

// -------------------- Computed --------------------
const totalBalance = computed(() => {
    return walletListRef.value?.totalBalance ?? 0
})

// -------------------- Modal Openers --------------------
const openFundModal = (wallet) => {
    if (!wallet?._id) return;  // don't open if invalid
    selectedWallet.value = wallet
    showFundModal.value = true
}


const openWithdrawModal = (wallet) => {
    if (!wallet?._id) return;
    selectedWallet.value = wallet
    showWithdrawModal.value = true
}

// -------------------- Modal Closers --------------------
const closeFundModal = () => {
    showFundModal.value = false
    selectedWallet.value = null
}

const closeWithdrawModal = () => {
    showWithdrawModal.value = false
    selectedWallet.value = null
}

// -------------------- Actions --------------------
const confirmFundWallet = async (payload) => {
    try {
        await walletStore.fundWallet(payload)
        toastRef.value.addToast('Wallet funded successfully', 'success')
        closeFundModal()
    } catch (err) {
        toastRef.value.addToast(
            err.response?.data?.message || 'Funding failed',
            'error'
        )
    }
}

const confirmWithdrawWallet = async (payload) => {
    try {
        await walletStore.withdrawWallet(payload)
        toastRef.value.addToast('Withdrawal successful', 'success')
        closeWithdrawModal()
    } catch (err) {
        toastRef.value.addToast(
            err.response?.data?.message || 'Withdrawal failed',
            'error'
        )
    }
}

// -------------------- Lifecycle --------------------
onMounted(async () => {
    await authStore.fetchMe()
    await Promise.all([
        walletStore.fetchWallets(),
        transactionStore.fetchTransactions(),
    ])
})
</script>

<template>
    <AppLayout>
        <div class="space-y-8">

            <!-- Total Balance -->
            <TotalWalletBalanceCard :totalBalance="totalBalance" :defaultCurrency="user?.defaultCurrency" />

            <!-- Wallets -->
            <section>
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Payment Wallets
                </h3>

                <WalletList ref="walletListRef" @fund="openFundModal" @withdraw="openWithdrawModal" />
            </section>

            <!-- FX Chart -->
            <FxChart />

            <!-- Transactions -->
            <section>
                <div class="flex justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Recent Transactions
                    </h3>

                    <BaseButton v-if="transactionsListRef?.total > 5" variant="ghost" size="sm"
                        @click="gotoRoute('/transactions')">
                        View all
                    </BaseButton>
                </div>

                <TransactionsList ref="transactionsListRef" :max-items="7" />
            </section>

            <!-- Modals -->
            <FundWalletModal :show="showFundModal" :selected-wallet="selectedWallet" @close="closeFundModal"
                @confirm="confirmFundWallet" />

            <WithdrawWalletModal :show="showWithdrawModal" :selected-wallet="selectedWallet" @close="closeWithdrawModal"
                @confirm="confirmWithdrawWallet" />

            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
