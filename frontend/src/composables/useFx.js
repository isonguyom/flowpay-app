// composables/useFx.js
import { useFxStore } from '@/stores/fx'

export function useFx({ feeRate }) {
    const fxStore = useFxStore()

    // -----------------------------
    // Fee calculation (platform fee)
    // -----------------------------
    const calculateFee = (amount) => {
        const value = Number(amount || 0)
        return value * feeRate.value
    }

    // -----------------------------
    // Currency conversion
    // -----------------------------
    const convert = (amount, from, to) => {
        const value = Number(amount || 0)
        if (!value || !from || !to) return 0

        const rate = fxStore.getExchangeRate(from, to)
        if (!rate) return 0

        return value * rate
    }

    return {
        calculateFee,
        convert,
    }
}
