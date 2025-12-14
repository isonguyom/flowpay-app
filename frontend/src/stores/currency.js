import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCurrencyStore = defineStore('currency', () => {
    // --- State ---
    const currencies = ref([]) // array of { label, value }
    const loading = ref(false)
    const error = ref(null)

    // --- Actions ---
    const fetchCurrencies = async () => {
        loading.value = true
        error.value = null
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Hard-coded currencies
            currencies.value = [
                { label: 'US Dollar (USD)', value: 'USD' },
                { label: 'Euro (EUR)', value: 'EUR' },
                { label: 'Nigerian Naira (NGN)', value: 'NGN' },
                { label: 'British Pound (GBP)', value: 'GBP' },
            ]
        } catch (err) {
            console.error(err)
            error.value = 'Failed to load currencies'
        } finally {
            loading.value = false
        }
    }

    // --- Getters ---
    const currencyOptions = computed(() => currencies.value)

    return {
        currencies,
        currencyOptions,
        loading,
        error,
        fetchCurrencies,
    }
})
