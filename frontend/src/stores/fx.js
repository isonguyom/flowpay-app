import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

/**
 * FX Store - Handles foreign exchange rates and currency conversions
 */
export const useFxStore = defineStore('fx', () => {
    // -----------------------------
    // State
    // -----------------------------
    const fxList = ref([])
    const base = ref('USD')
    const fallbackUsed = ref(false)

    const loading = ref(false)
    const error = ref(null)

    // Platform FX fee
    const feeRate = ref(0.02)

    // -----------------------------
    // Actions
    // -----------------------------

    /**
     * Fetch FX rates from backend
     * @param {string} baseCurrency
     * @returns {Promise<void>}
     */
    const fetchFx = async (baseCurrency = 'USD') => {
        loading.value = true
        error.value = null

        try {
            const res = await api.get(`/fx/rates?base=${baseCurrency}`)
            const data = res.data

            fxList.value = data.fxList || []
            base.value = data.base || baseCurrency
            fallbackUsed.value = data.fallbackUsed || false
        } catch (err) {
            console.error('FX fetch error:', err)
            error.value = err.response?.data?.message || 'Failed to load FX rates'
        } finally {
            loading.value = false
        }
    }

    // -----------------------------
    // Helpers
    // -----------------------------

    /**
     * Find currency object by code
     * @param {string} code
     * @returns {object|null}
     */
    const getCurrency = (code) =>
        fxList.value.find(c => c.value === code) || null

    /**
     * Get rate relative to base currency
     * @param {string} code
     * @returns {number|null}
     */
    const getRate = (code) => getCurrency(code)?.rate ?? null

    /**
     * Convert between any two currencies
     * @param {string} from
     * @param {string} to
     * @returns {number|null}
     */
    const getExchangeRate = (from, to) => {
        if (from === to) return 1

        const fromC = getCurrency(from)
        const toC = getCurrency(to)

        if (!fromC?.rate || !toC?.rate) return null

        return toC.rate / fromC.rate
    }

    // -----------------------------
    // Computed
    // -----------------------------
    const supportedCurrencies = computed(() => fxList.value.map(c => c.value))

    return {
        // state
        fxList,
        base,
        fallbackUsed,
        feeRate,
        loading,
        error,

        // actions
        fetchFx,

        // helpers
        getCurrency,
        getRate,
        getExchangeRate,

        // computed
        supportedCurrencies,
    }
})
