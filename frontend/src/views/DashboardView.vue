<script setup>
import { onMounted, computed, ref, watch } from 'vue'

import AppLayout from '@/layouts/AppLayout.vue'
import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'
import WalletCard from '@/components/cards/WalletCard.vue'
import TotalWalletBalanceCard from '@/components/cards/TotalWalletBalanceCard.vue'

import { useTransactionStore } from '@/stores/transactions'
import { useWalletStore } from '@/stores/wallets'
import { useUserStore } from '@/stores/user'
import { useFundingAccountsStore } from '@/stores/fundingAccounts'
import { useUtils } from '@/composables/useUtils'
import { storeToRefs } from 'pinia'
import FxChart from '@/components/charts/FxChart.vue'

// ------------------------
// Stores & Utils
// ------------------------
const transactionStore = useTransactionStore()
const walletStore = useWalletStore()
const userStore = useUserStore()
const fundingAccountsStore = useFundingAccountsStore()

const { profile } = storeToRefs(userStore)
const { gotoRoute } = useUtils()

// ------------------------
// Constants
// ------------------------
const MIN_FUND_AMOUNT = 5
const MIN_WITHDRAW_AMOUNT = 10

// ------------------------
// State
// ------------------------
const showFundModal = ref(false)
const showWithdrawModal = ref(false)
const selectedWallet = ref(null)
const submitting = ref(false)
const toastRef = ref(null)

// ------------------------
// Forms
// ------------------------
const fundForm = ref({
    fundingAccount: '',
    amount: MIN_FUND_AMOUNT,
})

const withdrawForm = ref({
    recipient: '',
    amount: MIN_WITHDRAW_AMOUNT,
})

const fundErrors = ref({})
const withdrawErrors = ref({})

// ------------------------
// Computed
// ------------------------
const totalBalance = computed(() =>
    walletStore.wallets.reduce(
        (sum, w) => sum + (Number(w.amount) || 0),
        0
    )
)

// ------------------------
// Helpers
// ------------------------
const simulateDelay = (ms = 600) =>
    new Promise(resolve => setTimeout(resolve, ms))

const resetState = () => {
    selectedWallet.value = null
    fundErrors.value = {}
    withdrawErrors.value = {}
}

// ------------------------
// Validation
// ------------------------
const validateFundForm = () => {
    fundErrors.value = {}

    if (!fundForm.value.fundingAccount) {
        fundErrors.value.fundingAccount = 'Funding account is required.'
    }

    if (
        !fundForm.value.amount ||
        fundForm.value.amount < MIN_FUND_AMOUNT
    ) {
        fundErrors.value.amount = `Minimum amount is ${MIN_FUND_AMOUNT}.`
    }

    return Object.keys(fundErrors.value).length === 0
}

const validateWithdrawForm = () => {
    withdrawErrors.value = {}

    if (!withdrawForm.value.recipient) {
        withdrawErrors.value.recipient = 'Recipient is required.'
    }

    if (
        !withdrawForm.value.amount ||
        withdrawForm.value.amount < MIN_WITHDRAW_AMOUNT
    ) {
        withdrawErrors.value.amount = `Minimum amount is ${MIN_WITHDRAW_AMOUNT}.`
    }

    return Object.keys(withdrawErrors.value).length === 0
}

// ------------------------
// Auto-clear Errors (UX fix)
// ------------------------
watch(() => fundForm.value.fundingAccount, v => {
    if (v) delete fundErrors.value.fundingAccount
})

watch(() => fundForm.value.amount, v => {
    if (v >= MIN_FUND_AMOUNT) delete fundErrors.value.amount
})

watch(() => withdrawForm.value.recipient, v => {
    if (v) delete withdrawErrors.value.recipient
})

watch(() => withdrawForm.value.amount, v => {
    if (v >= MIN_WITHDRAW_AMOUNT) delete withdrawErrors.value.amount
})

// ------------------------
// Modal Actions
// ------------------------
const openFundModal = wallet => {
    selectedWallet.value = wallet
    fundForm.value = { fundingAccount: '', amount: MIN_FUND_AMOUNT }
    fundErrors.value = {}
    showFundModal.value = true
}

const openWithdrawModal = wallet => {
    selectedWallet.value = wallet
    withdrawForm.value = { recipient: '', amount: MIN_WITHDRAW_AMOUNT }
    withdrawErrors.value = {}
    showWithdrawModal.value = true
}

// ------------------------
// Submit Handlers
// ------------------------
const confirmFund = async () => {
    if (!validateFundForm() || submitting.value) return

    submitting.value = true
    try {
        await simulateDelay()
        await walletStore.fundWallet(
            selectedWallet.value._id,
            Number(fundForm.value.amount)
        )

        await Promise.all([
            walletStore.fetchWallets(),
            transactionStore.fetchTransactions(),
        ])

        toastRef.value.addToast('Wallet funded successfully', 'success')
        showFundModal.value = false
        resetState()
    } catch (err) {
        toastRef.value.addToast(
            err?.response?.data?.message || 'Failed to fund wallet',
            'error'
        )
    } finally {
        submitting.value = false
    }
}

const confirmWithdraw = async () => {
    if (!validateWithdrawForm() || submitting.value) return

    const amount = Number(withdrawForm.value.amount)
    const balance = Number(selectedWallet.value?.amount || 0)

    // 🚫 Client-side insufficient funds guard
    if (amount > balance) {
        withdrawErrors.value.amount = 'Insufficient balance'
        toastRef.value.addToast(
            `Available balance: ${balance}`,
            'error'
        )
        return
    }

    submitting.value = true
    try {
        await simulateDelay()
        await walletStore.withdrawWallet(
            selectedWallet.value._id,
            amount
        )

        await Promise.all([
            walletStore.fetchWallets(),
            transactionStore.fetchTransactions(),
        ])

        toastRef.value.addToast('Withdrawal successful', 'success')
        showWithdrawModal.value = false
        resetState()
    } catch (err) {
        toastRef.value.addToast(
            err?.response?.data?.message ||
            'Unable to process withdrawal',
            'error'
        )
    } finally {
        submitting.value = false
    }
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(() => {
    userStore.fetchProfile()
    walletStore.fetchWallets()
    transactionStore.fetchTransactions()
    fundingAccountsStore.fetchFundingAccounts()
})
</script>

<template>
    <AppLayout>
        <div class="space-y-8">

            <!-- Total Balance -->
            <TotalWalletBalanceCard :totalBalance="totalBalance" :defaultCurrency="profile.defaultCurrency"
                @createWallet="gotoRoute('/wallets/create')" @makePayment="gotoRoute('/payment')" />

            <!-- Wallets -->
            <section>
                <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Funding Wallets
                </h3>

                <ApiSkeleton :loading="walletStore.loading" :error="walletStore.error" :items="walletStore.wallets">
                    <template #default="{ items }">
                        <div class="flex gap-4 overflow-x-auto pb-2">
                            <WalletCard v-for="wallet in items" :key="wallet._id" :wallet="wallet" @fund="openFundModal"
                                @withdraw="openWithdrawModal" />
                        </div>
                    </template>
                </ApiSkeleton>
            </section>


            <FxChart />



            <!-- Recent Transactions -->
            <section>
                <div class="flex justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Recent Transactions
                    </h3>
                    <BaseButton variant="ghost" size="sm" @click="gotoRoute('/transactions')">
                        View all
                    </BaseButton>
                </div>

                <TransactionsGrid :transactions="transactionStore.transactions" />
            </section>

            <!-- Fund Modal -->
            <ConfirmModal :show="showFundModal" title="Fund Wallet" :loading="submitting" @close="showFundModal = false"
                @confirm="confirmFund">
                <div class="space-y-4">
                    <BaseSelect label="Funding Account" v-model="fundForm.fundingAccount"
                        :options="fundingAccountsStore.accounts" :error="fundErrors.fundingAccount" />

                    <BaseInput label="Amount" type="number" v-model="fundForm.amount" :min="MIN_FUND_AMOUNT" step="0.01"
                        :error="fundErrors.amount" />
                </div>
            </ConfirmModal>

            <!-- Withdraw Modal -->
            <ConfirmModal :show="showWithdrawModal" title="Withdraw Funds" :loading="submitting"
                @close="showWithdrawModal = false" @confirm="confirmWithdraw">
                <div class="space-y-4">
                    <BaseInput label="Recipient" v-model="withdrawForm.recipient" :error="withdrawErrors.recipient" />

                    <BaseInput label="Amount" type="number" v-model="withdrawForm.amount" :min="MIN_WITHDRAW_AMOUNT"
                        step="0.01" :error="withdrawErrors.amount" />
                </div>
            </ConfirmModal>

            <!-- Toast -->
            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
