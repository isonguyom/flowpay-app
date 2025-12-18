import { useFxStore } from '@/stores/fx'

export function useFx({ feeRate }) {
    const fxStore = useFxStore()

    const calculateFee = (amount) =>
        Number(amount || 0) * feeRate.value

    const convert = (amount, from, to) => {
        const rate = fxStore.getExchangeRate(from, to)
        if (!rate) return 0
        return (Number(amount) * rate).toFixed(2)
    }

    return { calculateFee, convert }
}
