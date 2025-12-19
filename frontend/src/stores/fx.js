// stores/fx.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useFxStore = defineStore('fx', () => {
    // -----------------------------
    // State
    // -----------------------------
    const fxList = ref([])           // full currency objects from backend
    const base = ref('USD')
    const fallbackUsed = ref(false)

    const loading = ref(false)
    const error = ref(null)

    // Platform FX fee
    const feeRate = ref(0.02)

    // -----------------------------
    // Fetch FX from backend
    // -----------------------------
    const fetchFx = async (baseCurrency = 'USD') => {
        loading.value = true
        error.value = null

        try {
            const res = await api.get(`/fx/rates?base=${baseCurrency}`)

            fxList.value = res.data.fxList
            base.value = res.data.base
            fallbackUsed.value = res.data.fallbackUsed
        } catch (err) {
            console.error('FX fetch error:', err)
            error.value =
                err.response?.data?.message || 'Failed to load FX rates'
        } finally {
            loading.value = false
        }
    }

    // -----------------------------
    // Helpers
    // -----------------------------

    // Find currency object by code
    const getCurrency = (code) =>
        fxList.value.find(c => c.value === code) || null

    // Get direct rate (relative to base)
    const getRate = (code) => {
        const currency = getCurrency(code)
        return currency?.rate ?? null
    }

    // Convert between any two currencies
    const getExchangeRate = (from, to) => {
        if (from === to) return 1

        const fromC = getCurrency(from)
        const toC = getCurrency(to)

        if (!fromC || !toC || !fromC.rate || !toC.rate) return null

        return toC.rate / fromC.rate
    }

    // -----------------------------
    // Computed helpers
    // -----------------------------
    const supportedCurrencies = computed(() =>
        fxList.value.map(c => c.value)
    )

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
