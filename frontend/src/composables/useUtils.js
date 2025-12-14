/**
 * Shared utility helpers
 * Keep this composable PURE (no state, no side effects)
 */
export function useUtils() {
    /**
     * Format currency with locale support
     */
    const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
        if (amount === null || amount === undefined) return '--'

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(Number(amount))
    }

    /**
     * Format plain numbers (e.g settlementAmount)
     */
    const formatNumber = (value, locale = 'en-US') => {
        if (value === null || value === undefined) return '--'
        return new Intl.NumberFormat(locale).format(Number(value))
    }

    /**
     * Format date (e.g transactions)
     */
    const formatDate = (date) => {
        if (!date) return '--'

        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    /**
     * Status color helper
     */
    const getStatusClass = (status) => {
        switch (status) {
            case 'Settled':
                return 'text-green-600'
            case 'Pending':
                return 'text-yellow-600'
            case 'Failed':
                return 'text-red-600'
            default:
                return 'text-gray-500'
        }
    }

    /**
     * Simulate API delay (used across stores)
     */
    const sleep = (ms = 1000) =>
        new Promise((resolve) => setTimeout(resolve, ms))

    return {
        formatCurrency,
        formatNumber,
        formatDate,
        getStatusClass,
        sleep,
    }
}
