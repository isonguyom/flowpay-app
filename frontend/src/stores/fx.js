// stores/fx.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFxStore = defineStore('fx', () => {
    // ------------------------
    // State
    // ------------------------
    const fxRates = ref({
        USD_NGN: 1500,
        EUR_NGN: 1650,
        USD_EUR: 0.92,
        EUR_USD: 1.09,
    })

    const feeRate = ref(0.02) // 2% processing fee
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------
    const setRates = (rates = {}) => {
        fxRates.value = { ...fxRates.value, ...rates }
    }

    const setFeeRate = (rate) => {
        feeRate.value = rate
    }

    // Simulate FX fetch
    const fetchRates = async () => {
        loading.value = true
        error.value = null

        try {
            // simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1200))

            // mock response
            setRates({
                USD_NGN: 1520,
                EUR_NGN: 1680,
            })
        } catch (err) {
            error.value = 'Failed to load FX rates'
        } finally {
            loading.value = false
        }
    }

    return {
        fxRates,
        feeRate,
        loading,
        error,
        setRates,
        setFeeRate,
        fetchRates,
    }
})
