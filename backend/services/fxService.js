import axios from 'axios'
import { currencies, DEFAULT_CURRENCY, isCurrencyAllowed, getCurrencyMeta } from '../config/currencies.js'

/**
 * Get FX rates normalized to a dynamic base currency.
 * Returns rates and meta info for all supported currencies.
 *
 * @param {string} baseCurrency - Desired base currency (falls back to DEFAULT_CURRENCY)
 */
export const getFxRates = async (baseCurrency) => {
    // Validate and normalize base currency
    const base = isCurrencyAllowed(baseCurrency) ? baseCurrency.toUpperCase() : DEFAULT_CURRENCY

    let apiRates = {}
    let fallbackUsed = false

    try {
        const res = await axios.get(`https://api.frankfurter.app/latest?from=${base}`)
        apiRates = res.data.rates
    } catch {
        fallbackUsed = true
    }

    const fxList = Object.entries(currencies).map(([code, meta]) => {
        const currencyMeta = getCurrencyMeta(code)

        // Normalize rate: 1 for base currency, else API or offline rate
        let rate
        if (code === base) {
            rate = 1
        } else if (apiRates[code]) {
            rate = apiRates[code]
        } else if (currencyMeta.offlineRate) {
            rate = currencyMeta.offlineRate
            fallbackUsed = true
        } else {
            // If currency exists but no offline rate, fallback to 1:1 flagged
            rate = 1
            fallbackUsed = true
        }

        return {
            value: code,
            label: currencyMeta.label,
            symbol: currencyMeta.symbol,
            color: currencyMeta.color,
            rate,
            offline: !apiRates[code], // true if we had to use offline or default
        }
    })

    return {
        base,
        fallbackUsed,
        fxList,
    }
}

/**
 * Convert an amount from one currency to another using dynamic FX rates.
 */
export const convertAmount = async (amount, from, to) => {
    const { fxList } = await getFxRates(from)
    const target = fxList.find(c => c.value === to.toUpperCase())
    if (!target) throw new Error(`Currency ${to} is not supported`)

    return amount * target.rate
}
