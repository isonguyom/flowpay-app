<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import AppLayout from '@/layouts/AppLayout.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmModal from '@/components/utilities/ConfirmModal.vue'
import BaseToast from '@/components/utilities/BaseToast.vue'

import { useCurrencyStore } from '@/stores/currency'
import { useFxStore } from '@/stores/fx'
import { useFx } from '@/composables/useFx'

// ------------------------
// Stores
// ------------------------
const currencyStore = useCurrencyStore()
const fxStore = useFxStore()
const { fxRates, feeRate, loading: fxLoading } = storeToRefs(fxStore)

// ------------------------
// FX Logic
// ------------------------
const { getRate, calculateFee, convert } = useFx({
    feeRate: feeRate.value,
    initialRates: fxRates.value,
})

// ------------------------
// Form State
// ------------------------
const loading = ref(false)
const showConfirmModal = ref(false)
const toastRef = ref(null)

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

const errors = ref({
    beneficiary: null,
    amount: null,
    sourceCurrency: null,
    destinationCurrency: null,
})

// ------------------------
// Validation
// ------------------------
const validate = () => {
    errors.value.beneficiary =
        touched.value.beneficiary && !payment.value.beneficiary
            ? 'Beneficiary is required'
            : null

    errors.value.amount =
        touched.value.amount && !(Number(payment.value.amount) > 0)
            ? 'Amount must be greater than 0'
            : null

    errors.value.sourceCurrency =
        touched.value.sourceCurrency && !payment.value.sourceCurrency
            ? 'Select a source currency'
            : null

    errors.value.destinationCurrency =
        touched.value.destinationCurrency && !payment.value.destinationCurrency
            ? 'Select a destination currency'
            : null
}

// ------------------------
// Form Validity
// ------------------------
const isFormValid = computed(() =>
    payment.value.beneficiary &&
    Number(payment.value.amount) > 0 &&
    payment.value.sourceCurrency &&
    payment.value.destinationCurrency
)

// ------------------------
// FX Computed Values
// ------------------------
const fxRate = computed(() =>
    getRate(payment.value.sourceCurrency, payment.value.destinationCurrency)
)

const fee = computed(() =>
    payment.value.amount ? calculateFee(payment.value.amount) : 0
)

const convertedAmount = computed(() =>
    convert(payment.value.amount, payment.value.sourceCurrency, payment.value.destinationCurrency)
)

// ------------------------
// Submit Handlers
// ------------------------
const confirmPayment = () => {
    Object.keys(touched.value).forEach((key) => (touched.value[key] = true))
    validate()

    if (!isFormValid.value) {
        toastRef.value.addToast('Please fill all required fields correctly', 'error')
        return
    }

    showConfirmModal.value = true
}

const makePayment = () => {
    showConfirmModal.value = false
    loading.value = true

    setTimeout(() => {
        console.log({
            ...payment.value,
            fxRate: fxRate.value,
            fee: fee.value,
            settlementAmount: convertedAmount.value,
        })

        // Show success toast
        toastRef.value.addToast(
            `Payment of ${payment.value.amount} ${payment.value.sourceCurrency} to ${payment.value.beneficiary} was successful!`,
            'success'
        )

        loading.value = false

        // Reset form
        payment.value = {
            beneficiary: '',
            amount: '',
            sourceCurrency: currencyStore.currencyOptions[0]?.value || 'USD',
            destinationCurrency: currencyStore.currencyOptions[1]?.value || 'NGN',
        }
        Object.keys(touched.value).forEach(k => (touched.value[k] = false))
    }, 2000)
}

// ------------------------
// Lifecycle
// ------------------------
onMounted(async () => {
    await currencyStore.fetchCurrencies()
    await fxStore.fetchRates()

    payment.value.sourceCurrency =
        currencyStore.currencyOptions[0]?.value || 'USD'
    payment.value.destinationCurrency =
        currencyStore.currencyOptions[1]?.value || 'NGN'
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-2xl mx-auto py-6 space-y-8">
            <PageHeader title="Make Payment" subtitle="Convert funds and settle payments across borders" />

            <form @submit.prevent="confirmPayment" class="space-y-6">
                <BaseInput label="Beneficiary" placeholder="Name, email or account identifier"
                    v-model="payment.beneficiary" :error="errors.beneficiary" @blur="touched.beneficiary = true" />

                <BaseInput label="Payment Amount" type="number" placeholder="0.00" v-model="payment.amount"
                    :error="errors.amount" @blur="touched.amount = true" />

                <div class="grid grid-cols-2 gap-4">
                    <BaseSelect label="Source Currency" v-model="payment.sourceCurrency"
                        :options="currencyStore.currencyOptions" :loading="currencyStore.loading"
                        :error="errors.sourceCurrency" @change="touched.sourceCurrency = true" />
                    <BaseSelect label="Destination Currency" v-model="payment.destinationCurrency"
                        :options="currencyStore.currencyOptions" :loading="currencyStore.loading"
                        :error="errors.destinationCurrency" @change="touched.destinationCurrency = true" />
                </div>

                <!-- FX Breakdown -->
                <div v-if="fxRate && payment.amount" class="rounded-xl border border-gray-200 dark:border-gray-800
                   bg-gray-50 dark:bg-gray-900 p-4 text-sm space-y-2">
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

                    <div class="flex justify-between pt-2 border-t dark:border-gray-800">
                        <span class="text-gray-700 dark:text-gray-300">Beneficiary receives</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100">
                            {{ convertedAmount }} {{ payment.destinationCurrency }}
                        </span>
                    </div>
                </div>

                <BaseButton type="submit" fullWidth :disabled="!isFormValid || fxLoading" :loading="loading">
                    Confirm Payment
                </BaseButton>
            </form>

            <!-- Confirmation Modal -->
            <ConfirmModal :show="showConfirmModal" :title="'Confirm Payment'" :loading="loading"
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
