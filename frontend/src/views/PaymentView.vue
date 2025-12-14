<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import BaseInput from '@/components/utilities/BaseInput.vue'
import BaseButton from '@/components/utilities/BaseButton.vue'
import BaseSelect from '@/components/utilities/BaseSelect.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrencyStore } from '@/stores/currency'

const currencyStore = useCurrencyStore()

// ------------------------
// Payment Form State
// ------------------------
const loading = ref(false)
const payment = ref({
    beneficiary: '',
    amount: '',
    sourceCurrency: '',
    destinationCurrency: '',
})

const errors = ref({
    beneficiary: null,
    amount: null,
    sourceCurrency: null,
    destinationCurrency: null,
})

const hints = ref({
    // beneficiary: 'Enter the beneficiary name, email or account ID',
    // amount: 'Enter the amount to send',
    // sourceCurrency: 'Select the currency you are sending',
    // destinationCurrency: 'Select the currency the beneficiary will receive',
})

// ------------------------
// Mock FX Rates
// ------------------------
const fxRates = {
    USD_NGN: 1500,
    EUR_NGN: 1650,
    USD_EUR: 0.92,
    EUR_USD: 1.09,
}

const feeRate = 0.02 // 2% processing fee

// ------------------------
// Computed values
// ------------------------
const fxRate = computed(() => {
    const key = `${payment.value.sourceCurrency}_${payment.value.destinationCurrency}`
    return fxRates[key] || null
})

const fee = computed(() => {
    return payment.value.amount ? (Number(payment.value.amount) * feeRate).toFixed(2) : '0.00'
})

const convertedAmount = computed(() => {
    if (!fxRate.value || !payment.value.amount) return null
    return ((Number(payment.value.amount) - Number(fee.value)) * fxRate.value).toFixed(2)
})

// ------------------------
// Real-time validation
// ------------------------
watch(payment, (newVal) => {
    errors.value.beneficiary = newVal.beneficiary ? null : 'Beneficiary is required'
    errors.value.amount = newVal.amount && newVal.amount > 0 ? null : 'Amount must be greater than 0'
    errors.value.sourceCurrency = newVal.sourceCurrency ? null : 'Select a source currency'
    errors.value.destinationCurrency = newVal.destinationCurrency ? null : 'Select a destination currency'
})

const isFormValid = computed(() =>
    !Object.values(errors.value).some(Boolean) &&
    payment.value.beneficiary &&
    payment.value.amount &&
    payment.value.sourceCurrency &&
    payment.value.destinationCurrency
)

// ------------------------
// Submit handler
// ------------------------
const makePayment = () => {
    if (!isFormValid.value) return

    loading.value = true

    // Simulate API call with a 2-second delay
    setTimeout(() => {
        console.log({
            beneficiary: payment.value.beneficiary,
            amount: payment.value.amount,
            sourceCurrency: payment.value.sourceCurrency,
            destinationCurrency: payment.value.destinationCurrency,
            fxRate: fxRate.value,
            fee: fee.value,
            settlementAmount: convertedAmount.value,
        })

        loading.value = false
    }, 2000)
}

// ------------------------
// Load currencies on mount
// ------------------------
onMounted(async () => {
    await currencyStore.fetchCurrencies()
    // Set defaults
    payment.value.sourceCurrency = currencyStore.currencyOptions[0]?.value || 'USD'
    payment.value.destinationCurrency = currencyStore.currencyOptions[1]?.value || 'NGN'
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-xl space-y-8 mx-auto py-6">
            <!-- Header -->
            <PageHeader title="Make Payment" subtitle="Convert funds and settle payments across borders" />

            <!-- Payment Form -->
            <form @submit.prevent="makePayment" class="space-y-6">
                <!-- Beneficiary -->
                <BaseInput label="Beneficiary" placeholder="Name, email or account identifier"
                    v-model="payment.beneficiary" :error="errors.beneficiary" :hint="hints.beneficiary" />

                <!-- Amount -->
                <BaseInput label="Payment Amount" type="number" placeholder="0.00" v-model="payment.amount"
                    :error="errors.amount" :hint="hints.amount" />

                <!-- Currency Selection -->
                <div class="grid grid-cols-2 gap-4">
                    <BaseSelect label="Source Currency" v-model="payment.sourceCurrency"
                        :options="currencyStore.currencyOptions" :loading="currencyStore.loading"
                        :error="errors.sourceCurrency" :hint="hints.sourceCurrency" />
                    <BaseSelect label="Destination Currency" v-model="payment.destinationCurrency"
                        :options="currencyStore.currencyOptions" :loading="currencyStore.loading"
                        :error="errors.destinationCurrency" :hint="hints.destinationCurrency" />
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
                            {{ fee }} {{ payment.sourceCurrency }}
                        </span>
                    </div>

                    <div class="flex justify-between pt-2 border-t dark:border-gray-800">
                        <span class="text-gray-700 dark:text-gray-300">Beneficiary receives</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100">
                            {{ convertedAmount }} {{ payment.destinationCurrency }}
                        </span>
                    </div>
                </div>

                <!-- Submit Button -->
                <BaseButton type="submit" fullWidth :disabled="!isFormValid" :loading="loading">
                    Confirm Payment
                </BaseButton>
            </form>
        </div>
    </AppLayout>
</template>
