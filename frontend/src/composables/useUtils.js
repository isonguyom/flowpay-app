import { useFxStore } from "@/stores/fx"
import { useRouter } from "vue-router"

export function useUtils() {
    const router = useRouter()
    const fxStore = useFxStore()

    const formatCompactNumber = (value, decimals = 2) => {
        if (value === null || value === undefined) return '0.00'

        const abs = Math.abs(value)
        if (abs >= 1e9) return (value / 1e9).toFixed(decimals) + 'B'
        if (abs >= 1e6) return (value / 1e6).toFixed(decimals) + 'M'
        if (abs >= 1e3) return (value / 1e3).toFixed(decimals) + 'K'
        return value.toFixed(decimals)
    }

    const defaultSymbols = {
        USD: '$', NGN: '₦', EUR: '€', GBP: '£', JPY: '¥',
        AUD: 'A$', CAD: 'C$', BRL: 'R$', CHF: 'CHF'
    }

    const formatCurrencyCompact = (value, currency = 'USD', decimals = 2) => {
        // ALWAYS access fxList from store directly
        const fxList = fxStore.fxList.value || []
        const fxItem = fxList.find(c => c.value === currency)
        const symbol = fxItem?.symbol || defaultSymbols[currency] || currency
        return `${symbol}${formatCompactNumber(value, decimals)}`
    }

    const formatNumber = (value, locale = 'en-US', decimals = 2) => {
        if (value === null || value === undefined) return '--'
        return Number(value).toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
    }

    const formatDate = (date) => {
        if (!date) return '--'
        const d = typeof date === 'string' ? new Date(date) : date
        if (isNaN(d.getTime())) return '--'
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const gotoRoute = (route, options = {}) => {
        if (typeof route === 'string') router.push(route).catch(err => err)
        else if (typeof route === 'object' && route !== null) {
            const { name, path, params, query } = route
            if (name) router.push({ name, params, query, ...options }).catch(err => err)
            else if (path) router.push({ path, params, query, ...options }).catch(err => err)
        }
    }

    return {
        formatCompactNumber,
        formatCurrencyCompact,
        formatNumber,
        formatDate,
        gotoRoute
    }
}
