import { ref } from 'vue'

export function useFx({ feeRate = 0.02, initialRates = {} } = {}) {
    const fxRates = ref({ ...initialRates })

    const setRates = (rates = {}) => {
        fxRates.value = { ...fxRates.value, ...rates }
    }

    const getRate = (source, destination) => {
        if (!source || !destination) return null
        return fxRates.value[`${source}_${destination}`] || null
    }

    const calculateFee = (amount) => {
        if (!amount || Number(amount) <= 0) return 0
        return Number(amount) * feeRate
    }

    const convert = (amount, source, destination, deductFee = true) => {
        if (!source || !destination || !amount) return null

        // same currency
        if (source === destination) return Number(amount).toFixed(2)

        // try to get the rate
        let rate = fxRates.value[`${source}_${destination}`]

        // optional: try reverse rate if direct rate missing
        if (!rate) {
            const reverseRate = fxRates.value[`${destination}_${source}`]
            if (reverseRate) rate = 1 / reverseRate
        }

        if (!rate) return null

        const netAmount = deductFee ? Number(amount) - calculateFee(amount) : Number(amount)
        return (netAmount * rate).toFixed(2)
    }


    return {
        fxRates,
        setRates,
        getRate,
        calculateFee,
        convert,
    }
}
