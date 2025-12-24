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
import { useUtils } from '@/composables/useUtils'
import { useFx } from '@/composables/useFx'

/* ---------------------------------
   Stores & composables
---------------------------------- */
const fxStore = useFxStore()
const walletStore = useWalletStore()
const paymentStore = usePaymentStore()

const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)
const { wallets, loading: walletsLoading } = storeToRefs(walletStore)
const { loading: paymentLoading, flow } = storeToRefs(paymentStore)

const { calculateFee, convert } = useFx({ feeRate })
const { gotoRoute } = useUtils()

/* ---------------------------------
   Constants
---------------------------------- */
const SETTLEMENT_CURRENCY = 'USD'
const MIN_SETTLEMENT_USD = 0.5
const MIN_AMOUNT = 1

/* ---------------------------------
   UI state
---------------------------------- */
const showConfirmModal = ref(false)
const toastRef = ref(null)

/* ---------------------------------
   Form state
---------------------------------- */
const payment = ref({
    beneficiary: '',
    amount: '',
    sourceCurrency: '',
    destinationCurrency: ''
})

const touched = ref({
    beneficiary: false,
    amount: false,
    sourceCurrency: false,
    destinationCurrency: false
})

const errors = ref({})

/* ---------------------------------
   Derived state
---------------------------------- */
const amountNumber = computed(() => Number(payment.value.amount || 0))

const selectedWallet = computed(() =>
    wallets.value.find(w => w.currency === payment.value.sourceCurrency)
)

const fee = computed(() =>
    amountNumber.value > 0 ? calculateFee(amountNumber.value) : 0
)

const totalDebit = computed(() =>
    amountNumber.value + fee.value
)

const hasSufficientBalance = computed(() =>
    selectedWallet.value
        ? totalDebit.value <= selectedWallet.value.balance
        : false
)

const fxRate = computed(() => {
    if (!payment.value.sourceCurrency || !payment.value.destinationCurrency) return null
    return fxStore.getExchangeRate(
        payment.value.sourceCurrency,
        payment.value.destinationCurrency
    )
})

const convertedAmount = computed(() =>
    fxRate.value
        ? convert(
            amountNumber.value,
            payment.value.sourceCurrency,
            payment.value.destinationCurrency
        )
        : 0
)

const settlementUSD = computed(() => {
    const usdRate = fxStore.getExchangeRate(
        payment.value.sourceCurrency,
        SETTLEMENT_CURRENCY
    )
    return usdRate ? amountNumber.value * usdRate : 0
})

const meetsSettlementMinimum = computed(() =>
    settlementUSD.value >= MIN_SETTLEMENT_USD
)

const sourceWalletOptions = computed(() =>
    wallets.value.map(w => ({
        label: `${w.currency} (Balance: ${w.balance.toFixed(2)})`,
        value: w.currency
    }))
)

const isFormValid = computed(() =>
    payment.value.beneficiary &&
    amountNumber.value > 0 &&
    payment.value.sourceCurrency &&
    payment.value.destinationCurrency &&
    fxRate.value &&
    hasSufficientBalance.value &&
    meetsSettlementMinimum.value
)

/* ---------------------------------
   Validation
---------------------------------- */
const validate = () => {
    const walletBalance = selectedWallet.value?.balance ?? 0
    const usdRate = fxStore.getExchangeRate(
        payment.value.sourceCurrency,
        SETTLEMENT_CURRENCY
    )

    errors.value = {
        beneficiary:
            touched.value.beneficiary && !payment.value.beneficiary
                ? 'Beneficiary is required'
                : null,

        amount:
            touched.value.amount
                ? amountNumber.value <= 0
                    ? 'Amount must be greater than zero'
                    : totalDebit.value > walletBalance
                        ? 'Amount + fee exceeds wallet balance'
                        : !meetsSettlementMinimum.value && usdRate
                            ? `Minimum payment is ${MIN_SETTLEMENT_USD} USD (~${Math.ceil(
                                MIN_SETTLEMENT_USD / usdRate
                            )} ${payment.value.sourceCurrency})`
                            : null
                : null,

        sourceCurrency:
            touched.value.sourceCurrency && !payment.value.sourceCurrency
                ? 'Select a source wallet'
                : null,

        destinationCurrency:
            touched.value.destinationCurrency && !payment.value.destinationCurrency
                ? 'Select a destination currency'
                : null
    }
}

watch(payment, validate, { deep: true })

/* ---------------------------------
   Actions
---------------------------------- */
const confirmPayment = () => {
    Object.keys(touched.value).forEach(k => (touched.value[k] = true))
    validate()

    if (!isFormValid.value) {
        toastRef.value?.addToast('Please fix the form errors', 'error')
        return
    }

    showConfirmModal.value = true
}

const makePayment = async () => {
    try {

        console.log('Making payment with data:', {
            beneficiary: payment.value.beneficiary,
            amount: amountNumber.value,
            sourceWallet: payment.value.sourceCurrency.toUpperCase(),
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: fxRate.value,
            fee: fee.value
        })
        await paymentStore.makePayment({
            beneficiary: payment.value.beneficiary,
            amount: amountNumber.value,
            sourceWallet: payment.value.sourceCurrency.toUpperCase(),
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: fxRate.value,
            fee: fee.value
        })


        toastRef.value?.addToast('Payment submitted successfully', 'success')
        await new Promise(r => setTimeout(r, 800))
        gotoRoute('/transactions')
    } catch {
        toastRef.value?.addToast(
            paymentStore.error || 'Payment failed',
            'error'
        )
    } finally {
        showConfirmModal.value = false
    }
}

/* ---------------------------------
   Init
---------------------------------- */
onMounted(async () => {
    try {
        await Promise.all([
            walletStore.fetchWallets(),
            fxStore.fetchFx()
        ])

        if (!wallets.value.length) {
            toastRef.value?.addToast('No wallets available', 'error')
            return
        }

        payment.value.sourceCurrency = wallets.value[0].currency
        payment.value.destinationCurrency =
            fxList.value.find(c => c.value !== wallets.value[0].currency)?.value || ''
    } catch {
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
                    <i class="bi bi-rocket-takeoff text-2xl"></i>
                    You are using the NEW payment flow!
                </p>
            </div>

            <form @submit.prevent="confirmPayment" class="space-y-6">
                <BaseInput label="Beneficiary Address" placeholder="account address" v-model="payment.beneficiary"
                    :error="errors.beneficiary" @blur="touched.beneficiary = true" />

                <BaseInput label="Payment Amount" type="number" placeholder="0.00" v-model="payment.amount"
                    :min="MIN_AMOUNT" :error="errors.amount" @blur="touched.amount = true" />

                <div class="grid grid-cols-2 gap-4">
                    <BaseSelect label="Source Wallet" v-model="payment.sourceCurrency" :options="sourceWalletOptions"
                        :loading="walletsLoading" :error="errors.sourceCurrency"
                        @change="touched.sourceCurrency = true" />

                    <BaseSelect label="Destination Currency" v-model="payment.destinationCurrency" :options="fxList"
                        :loading="fxLoading" :error="errors.destinationCurrency"
                        @change="touched.destinationCurrency = true" />
                </div>

                <div v-if="fxRate && amountNumber" class="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-sm space-y-2">
                    <div class="flex justify-between">
                        <span>Exchange rate</span>
                        <span>
                            1 {{ payment.sourceCurrency }} = {{ fxRate }} {{ payment.destinationCurrency }}
                        </span>
                    </div>

                    <div class="flex justify-between">
                        <span>Processing fee</span>
                        <span>{{ fee.toFixed(2) }} {{ payment.sourceCurrency }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span>Total</span>
                        <span>{{ totalDebit.toFixed(2) }} {{ payment.sourceCurrency }}</span>
                    </div>

                    <div class="flex justify-between pt-2 border-t">
                        <span>Beneficiary receives</span>
                        <span class="font-semibold">
                            {{ convertedAmount }} {{ payment.destinationCurrency }}
                        </span>
                    </div>
                </div>

                <BaseButton type="submit" fullWidth :disabled="!isFormValid || fxLoading || walletsLoading"
                    :loading="paymentLoading">
                    Confirm Payment
                </BaseButton>
            </form>

            <ConfirmModal :show="showConfirmModal" title="Confirm Payment" :loading="paymentLoading"
                @close="showConfirmModal = false" @confirm="makePayment">
                <p>
                    You are about to send
                    <strong>{{ payment.amount }} {{ payment.sourceCurrency }}</strong>
                    to <strong>{{ payment.beneficiary }}</strong>.
                </p>
            </ConfirmModal>

            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
