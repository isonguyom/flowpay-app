<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import { useFxStore } from '@/stores/fx'
import { usePaymentStore } from '@/stores/payment'
import { useWalletStore } from '@/stores/wallets'
import { useTransactionStore } from '@/stores/transactions'

import { useFx } from '@/composables/useFx'
import { useUtils } from '@/composables/useUtils'

const paymentStore = usePaymentStore()
const fxStore = useFxStore()
const walletStore = useWalletStore()
const transactionStore = useTransactionStore()

const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)
const { wallets, loading: walletsLoading } = storeToRefs(walletStore)
const { flow } = storeToRefs(paymentStore)

const { calculateFee, convert } = useFx({ feeRate })
const { gotoRoute } = useUtils()

// ------------------------
// Constants
// ------------------------
const SETTLEMENT_CURRENCY = 'USD'
const MIN_SETTLEMENT_AMOUNT = 0.5 // $0.50 minimum

// ------------------------
// UI & Form State
// ------------------------
const loading = ref(false)
const showConfirmModal = ref(false)
const toastRef = ref(null)
const minAmount = 1

const payment = ref({
    beneficiary: '',
    amount: '',
    sourceWallet: '',
    destinationCurrency: '',
})

const touched = ref({
    beneficiary: false,
    amount: false,
    sourceWallet: false,
    destinationCurrency: false,
})

const errors = ref({})

// ------------------------
// Computed
// ------------------------
const selectedWallet = computed(() =>
    wallets.value.find(w => w.currency === payment.value.sourceWallet)
)

const fee = computed(() =>
    payment.value.amount ? calculateFee(payment.value.amount) : 0
)

const totalAmount = computed(() =>
    Number(payment.value.amount || 0) + Number(fee.value)
)

const hasSufficientBalance = computed(() =>
    selectedWallet.value ? totalAmount.value <= selectedWallet.value.amount : false
)

const fxRate = computed(() =>
    payment.value.sourceWallet && payment.value.destinationCurrency
        ? fxStore.getExchangeRate(payment.value.sourceWallet, payment.value.destinationCurrency)
        : null
)

const convertedAmount = computed(() =>
    payment.value.amount && fxRate.value
        ? convert(payment.value.amount, payment.value.sourceWallet, payment.value.destinationCurrency)
        : 0
)

const settlementInUSD = computed(() =>
    payment.value.amount && payment.value.sourceWallet
        ? convert(payment.value.amount, payment.value.sourceWallet, SETTLEMENT_CURRENCY)
        : 0
)

const meetsSettlementMinimum = computed(() =>
    settlementInUSD.value >= MIN_SETTLEMENT_AMOUNT
)

const sourceWalletOptions = computed(() =>
    wallets.value.map(w => ({
        label: `${w.currency} (Balance: ${w.amount})`,
        value: w.currency,
    }))
)

const isFormValid = computed(() =>
    payment.value.beneficiary &&
    Number(payment.value.amount) > 0 &&
    payment.value.sourceWallet &&
    payment.value.destinationCurrency &&
    fxRate.value &&
    hasSufficientBalance.value &&
    meetsSettlementMinimum.value
)

// ------------------------
// Validation
// ------------------------
const validate = () => {
    const amount = Number(payment.value.amount || 0)
    const walletBalance = selectedWallet.value?.amount || 0
    const total = totalAmount.value

    errors.value = {
        beneficiary: touched.value.beneficiary && !payment.value.beneficiary ? 'Beneficiary is required' : null,
        amount: touched.value.amount
            ? amount <= 0
                ? 'Amount must be greater than 0'
                : total > walletBalance
                    ? `Amount + fee exceeds wallet balance (${walletBalance})`
                    : !meetsSettlementMinimum.value
                        ? `Minimum payment is ${MIN_SETTLEMENT_AMOUNT} USD (~${Math.ceil(
                            MIN_SETTLEMENT_AMOUNT / fxStore.getExchangeRate(payment.value.sourceWallet, 'USD')
                        )} ${payment.value.sourceWallet})`
                        : null
            : null,
        sourceWallet: touched.value.sourceWallet && !payment.value.sourceWallet ? 'Select a source currency' : null,
        destinationCurrency: touched.value.destinationCurrency && !payment.value.destinationCurrency ? 'Select a destination currency' : null,
    }
}

watch(payment, validate, { deep: true })

// ------------------------
// Handlers
// ------------------------
const confirmPayment = () => {
    Object.keys(touched.value).forEach(k => (touched.value[k] = true))
    validate()

    if (!meetsSettlementMinimum.value) {
        toastRef.value?.addToast(
            `Minimum payment is ${MIN_SETTLEMENT_AMOUNT} USD (~${Math.ceil(
                MIN_SETTLEMENT_AMOUNT / fxStore.getExchangeRate(payment.value.sourceWallet, 'USD')
            )} ${payment.value.sourceWallet})`,
            'error'
        )
        return
    }

    if (!isFormValid.value) {
        toastRef.value?.addToast(
            !hasSufficientBalance.value ? 'Total amount including fee exceeds wallet balance' : 'Please fix the form errors',
            'error'
        )
        return
    }

    showConfirmModal.value = true
}

const makePayment = async () => {
    loading.value = true
    try {
        const payload = {
            beneficiary: payment.value.beneficiary,
            amount: Number(payment.value.amount),
            sourceWallet: payment.value.sourceWallet,
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: fxRate.value,
            fee: fee.value,
            settlementAmount: convertedAmount.value, // already computed
        }

        const { transactionId } = await paymentStore.makePayment(payload)

        transactionStore.addTransaction({
            _id: transactionId,
            user: { _id: null },
            type: 'PAYMENT',
            fundingAccount: payment.value.sourceWallet,
            beneficiary: payment.value.beneficiary,
            amount: Number(payment.value.amount) || 0,
            settlementAmount: convertedAmount.value || 0,
            fee: Number(fee.value) || 0,
            sourceCurrency: payment.value.sourceWallet,
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: Number(fxRate.value) || 0,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        })

        toastRef.value?.addToast('Payment submitted successfully', 'success')
        await new Promise(resolve => setTimeout(resolve, 1200))
        gotoRoute('/transactions')

        // Reset form
        paymentStore.reset()
        payment.value = {
            beneficiary: '',
            amount: '',
            sourceWallet: wallets.value[0]?.currency || '',
            destinationCurrency: fxList.value.find(c => c.value !== wallets.value[0]?.currency)?.value || ''
        }
        Object.keys(touched.value).forEach(k => (touched.value[k] = false))

    } catch (err) {
        toastRef.value?.addToast(paymentStore.error || 'Payment failed. Please try again.', 'error')
    } finally {
        loading.value = false
        showConfirmModal.value = false
    }
}

// ------------------------
// Watchers
// ------------------------
watch(
    () => payment.value.sourceWallet,
    newCurrency => {
        if (payment.value.destinationCurrency === newCurrency) {
            payment.value.destinationCurrency =
                fxList.value.find(c => c.value !== newCurrency)?.value || ''
        }
    }
)

// ------------------------
// Init
// ------------------------
onMounted(async () => {
    try {
        await Promise.all([walletStore.fetchWallets(), fxStore.fetchFx()])

        if (!wallets.value.length) {
            toastRef.value?.addToast('No wallets available', 'error')
            return
        }

        payment.value.sourceWallet = wallets.value[0].currency
        payment.value.destinationCurrency =
            fxList.value.find(c => c.value !== wallets.value[0].currency)?.value || ''
    } catch (err) {
        toastRef.value?.addToast('Failed to load payment data', 'error')
    }
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl mx-auto py-6 space-y-8">
            <PageHeader title="Make Payment" subtitle="Convert funds and settle payments across borders" />

            <div v-if="flow === 'new'"
                class="p-4 rounded-xl bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800">
                <p class="text-green-700 dark:text-green-200 font-medium flex items-center gap-2">
                    <i class="bi bi-rocket-takeoff text-light text-2xl"></i>
                    You are using the NEW payment flow!
                </p>
            </div>

            <form @submit.prevent="confirmPayment" class="space-y-6">
                <BaseInput label="Beneficiary Address" placeholder="account address" v-model="payment.beneficiary"
                    :error="errors.beneficiary" @blur="touched.beneficiary = true" />

                <BaseInput label="Payment Amount" type="number" placeholder="0.00" v-model="payment.amount"
                    :min="minAmount" :error="errors.amount" @blur="touched.amount = true" />

                <div class="grid grid-cols-2 gap-4">
                    <BaseSelect label="Source Wallet" v-model="payment.sourceWallet" :options="sourceWalletOptions"
                        :loading="walletsLoading" :error="errors.sourceWallet" @change="touched.sourceWallet = true" />
                    <BaseSelect label="Destination Currency" v-model="payment.destinationCurrency" :options="fxList"
                        :loading="fxLoading" :error="errors.destinationCurrency"
                        @change="touched.destinationCurrency = true" />
                </div>

                <div v-if="fxRate && payment.amount"
                    class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Exchange rate</span>
                        <span class="font-medium">
                            1 {{ payment.sourceWallet }} = {{ fxRate }} {{ payment.destinationCurrency }}
                        </span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Processing fee</span>
                        <span class="font-medium">{{ fee.toFixed(2) }} {{ payment.sourceWallet }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Total</span>
                        <span class="font-medium">{{ totalAmount.toFixed(2) }} {{ payment.sourceWallet }}</span>
                    </div>

                    <div class="flex justify-between pt-2 border-t dark:border-gray-800">
                        <span class="text-gray-700 dark:text-gray-300">Beneficiary receives</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100">
                            {{ convertedAmount }} {{ payment.destinationCurrency }}
                        </span>
                    </div>
                </div>

                <BaseButton type="submit" fullWidth :disabled="!isFormValid || fxLoading || walletsLoading"
                    :loading="loading">
                    Confirm Payment
                </BaseButton>
            </form>

            <ConfirmModal :show="showConfirmModal" title="Confirm Payment" :loading="loading"
                @close="showConfirmModal = false" @confirm="makePayment">
                <p>
                    You are about to send
                    <strong>{{ payment.amount }} {{ payment.sourceWallet }}</strong> to
                    <strong>{{ payment.beneficiary }}</strong>. The beneficiary will receive
                    <strong>{{ convertedAmount }} {{ payment.destinationCurrency }}</strong>.
                </p>
            </ConfirmModal>

            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
