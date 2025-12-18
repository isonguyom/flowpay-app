<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

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

import { useFx } from '@/composables/useFx'
import { useUtils } from '@/composables/useUtils'

const paymentStore = usePaymentStore()
const fxStore = useFxStore()
const walletStore = useWalletStore()

const { fxList, feeRate, loading: fxLoading } = storeToRefs(fxStore)
const { wallets, loading: walletsLoading } = storeToRefs(walletStore)

const { calculateFee, convert } = useFx({
    feeRate,
    rates: fxList,
})

const { gotoRoute } = useUtils()

const router = useRouter()

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
    sourceCurrency: '',
    destinationCurrency: '',
})

const touched = ref({
    beneficiary: false,
    amount: false,
    sourceCurrency: false,
    destinationCurrency: false,
})

const errors = ref({})

// ------------------------
// Wallet Helpers
// ------------------------
const selectedWallet = computed(() =>
    wallets.value.find(w => w.currency === payment.value.sourceCurrency)
)

const fee = computed(() => payment.value.amount ? calculateFee(payment.value.amount) : 0)
const totalAmount = computed(() =>
    Number(payment.value.amount || 0) + Number(fee.value)
)


const hasSufficientBalance = computed(() =>
    selectedWallet.value ? totalAmount.value <= selectedWallet.value.amount : false
)

// ------------------------
// Validation
// ------------------------
const validate = () => {
    const amount = Number(payment.value.amount || 0)
    const walletBalance = selectedWallet.value?.amount || 0
    const total = totalAmount.value

    errors.value = {
        beneficiary: touched.value.beneficiary && !payment.value.beneficiary
            ? 'Beneficiary is required'
            : null,

        amount: touched.value.amount
            ? amount <= 0
                ? 'Amount must be greater than 0'
                : total > walletBalance
                    ? `Amount + fee exceeds wallet balance (${walletBalance})`
                    : null
            : null,

        sourceCurrency: touched.value.sourceCurrency && !payment.value.sourceCurrency
            ? 'Select a source currency'
            : null,

        destinationCurrency: touched.value.destinationCurrency && !payment.value.destinationCurrency
            ? 'Select a destination currency'
            : null,
    }
}

watch(payment, validate, { deep: true })


// ------------------------
// FX Computed
// ------------------------
const fxRate = computed(() => {
    const { sourceCurrency, destinationCurrency } = payment.value
    if (!sourceCurrency || !destinationCurrency) return null
    return fxStore.getExchangeRate(sourceCurrency, destinationCurrency)
})


const convertedAmount = computed(() =>
    payment.value.amount > 0 && fxRate.value
        ? convert(
            Number(payment.value.amount),
            payment.value.sourceCurrency,
            payment.value.destinationCurrency
        )
        : 0
)

// ------------------------
// Wallet Options
// ------------------------
const sourceWalletOptions = computed(() =>
    wallets.value.map(w => ({
        label: `${w.currency} (Balance: ${w.amount})`,
        value: w.currency,
    }))
)

// ------------------------
// Form Validity
// ------------------------
const isFormValid = computed(() =>
    payment.value.beneficiary &&
    Number(payment.value.amount) > 0 &&
    payment.value.sourceCurrency &&
    payment.value.destinationCurrency &&
    fxRate.value &&
    hasSufficientBalance.value
)

// ------------------------
// Handlers
// ------------------------
const confirmPayment = () => {
    Object.keys(touched.value).forEach(k => touched.value[k] = true)
    validate()

    if (!isFormValid.value) {
        if (!hasSufficientBalance.value) {
            toastRef.value?.addToast('Total amount including fee exceeds wallet balance', 'error')
        } else {
            toastRef.value?.addToast('Please fix the form errors', 'error')
        }
        return
    }

    showConfirmModal.value = true
}

const makePayment = async () => {
    loading.value = true
    try {
        await paymentStore.makePayment({
            beneficiary: payment.value.beneficiary,
            amount: Number(payment.value.amount),
            sourceCurrency: payment.value.sourceCurrency,
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: fxRate.value,
            fee: fee.value,
            settlementAmount: convertedAmount.value,
        })

        toastRef.value?.addToast('Payment submitted successfully', 'success')

        // Wait a moment so user sees the toast
        await new Promise(resolve => setTimeout(resolve, 1800))

        gotoRoute('/transactions')

        // Reset form
        payment.value = {
            beneficiary: '',
            amount: '',
            sourceCurrency: wallets.value[0]?.currency || '',
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


watch(
    () => payment.value.sourceCurrency,
    (newCurrency) => {
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
        await Promise.all([
            walletStore.fetchWallets(),
            fxStore.fetchFx(),
        ])

        if (!wallets.value.length) {
            toastRef.value?.addToast('No wallets available', 'error')
            return
        }

        payment.value.sourceCurrency = wallets.value[0].currency
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

            <form @submit.prevent="confirmPayment" class="space-y-6">
                <BaseInput label="Beneficiary Address" placeholder="account address" v-model="payment.beneficiary"
                    :error="errors.beneficiary" @blur="touched.beneficiary = true" />

                <BaseInput label="Payment Amount" type="number" placeholder="0.00" v-model="payment.amount"
                    :min="minAmount" :error="errors.amount" @blur="touched.amount = true" />


                <div class="grid grid-cols-2 gap-4">
                    <BaseSelect label="Source Wallet" v-model="payment.sourceCurrency" :options="sourceWalletOptions"
                        :loading="walletsLoading" :error="errors.sourceCurrency"
                        @change="touched.sourceCurrency = true" />

                    <BaseSelect label="Destination Currency" v-model="payment.destinationCurrency" :options="fxList"
                        :loading="fxLoading" :error="errors.destinationCurrency"
                        @change="touched.destinationCurrency = true" />
                </div>

                <!-- FX Breakdown -->
                <div v-if="fxRate && payment.amount"
                    class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Exchange rate</span>
                        <span class="font-medium">
                            1 {{ payment.sourceCurrency }} = {{ fxRate }} {{ payment.destinationCurrency }}
                        </span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Processing fee</span>
                        <span class="font-medium">
                            {{ fee.toFixed(2) }} {{ payment.sourceCurrency }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Total</span>
                        <span class="font-medium">
                            {{ totalAmount.toFixed(2) }} {{ payment.sourceCurrency }}
                        </span>
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

            <!-- Confirmation Modal -->
            <ConfirmModal :show="showConfirmModal" title="Confirm Payment" :loading="loading"
                @close="showConfirmModal = false" @confirm="makePayment">
                <p>
                    You are about to send
                    <strong>{{ payment.amount }} {{ payment.sourceCurrency }}</strong> to
                    <strong>{{ payment.beneficiary }}</strong>. The beneficiary will receive
                    <strong>{{ convertedAmount }} {{ payment.destinationCurrency }}</strong>.
                </p>
            </ConfirmModal>

            <!-- Toast -->
            <BaseToast ref="toastRef" />
        </div>
    </AppLayout>
</template>
