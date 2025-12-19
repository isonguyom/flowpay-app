import axios from 'axios'
import { currencies } from '../config/currencies.js'

export const getFxRates = async (base = 'USD') => {
    let apiRates = {}
    let fallbackUsed = false

    try {
        const res = await axios.get(
            `https://api.frankfurter.app/latest?from=${base}`
        )
        apiRates = res.data.rates
    } catch {
        fallbackUsed = true
    }

    const fxList = Object.entries(currencies).map(([code, meta]) => {
        const rate =
            code === base
                ? 1
                : apiRates[code] ?? meta.offlineRate ?? null

        if (!apiRates[code] && meta.offlineRate) {
            fallbackUsed = true
        }

        return {
            value: code,              // ✅ canonical identifier
            label: meta.label,
            symbol: meta.symbol,
            color: meta.color,
            rate,
            offline: !apiRates[code],
        }
    })

    return {
        base,
        fallbackUsed,
        fxList,
    }
}
