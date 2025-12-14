import { useCurrencyStore } from "@/stores/currency"
import { useRouter } from "vue-router"

export function useUtils() {
    const router = useRouter()
    const { currencySymbols } = useCurrencyStore()

    /**
     * Format number to K, M, B
     */
    const formatCompactNumber = (value, decimals = 2) => {
        if (value === null || value === undefined) return '0'

        const abs = Math.abs(value)

        if (abs >= 1e9) return (value / 1e9).toFixed(decimals) + 'B'
        if (abs >= 1e6) return (value / 1e6).toFixed(decimals) + 'M'
        if (abs >= 1e3) return (value / 1e3).toFixed(decimals) + 'K'

        return value.toString()
    }

    /**
     * Format currency + compact number
     * e.g. ₦1.2M, $3.4K
     */
    const formatCurrencyCompact = (
        value,
        currency = 'USD',
        decimals = 2
    ) => {
        const symbol = currencySymbols[currency] || ''
        return `${symbol}${formatCompactNumber(value, decimals)}`
    }

    /**
     * Format date
     */
    const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    /**
      * Format plain numbers (e.g settlementAmount)
      */
    const formatNumber = (value, locale = 'en-US') => {
        if (value === null || value === undefined) return '--'
        return new Intl.NumberFormat(locale).format(Number(value))
    }

    const gotoRoute = (route, options = {}) => {
        if (typeof route === 'string') {
            router.push(route).catch(err => err)
        } else if (typeof route === 'object' && route !== null) {
            const { name, path, params, query } = route
            if (name) {
                router.push({ name, params, query, ...options }).catch(err => err)
            } else if (path) {
                router.push({ path, params, query, ...options }).catch(err => err)
            }
        }
    }


    return {
        formatCompactNumber,
        formatCurrencyCompact,
        formatDate,
        formatNumber,
        gotoRoute
    }
}
