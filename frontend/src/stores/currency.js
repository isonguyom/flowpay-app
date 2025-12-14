import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCurrencyStore = defineStore('currency', () => {
    // --- State ---
    const currencies = ref([]) // array of { label, value }
    const loading = ref(false)
    const error = ref(null)

    const currencySymbols = {
        NGN: '₦',
        USD: '$',
        EUR: '€',
        GBP: '£',
        GHS: '₵',
        KES: 'KSh',
        ZAR: 'R',
    }

    const currencyColorMap = {
        USD: 'bg-green-500',
        EUR: 'bg-blue-500',
        NGN: 'bg-indigo-500',
        GBP: 'bg-purple-500',
        JPY: 'bg-red-500',
        AUD: 'bg-yellow-500',
        CAD: 'bg-pink-500',
    }

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
        currencySymbols,
        currencyColorMap,
        fetchCurrencies,
    }
})
