// stores/fx.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

// Minimal currency metadata for label & symbol
const currencyMeta = {
    USD: { label: 'US Dollar', symbol: '$' },
    NGN: { label: 'Nigerian Naira', symbol: '₦' },
    EUR: { label: 'Euro', symbol: '€' },
    GBP: { label: 'British Pound', symbol: '£' },
    JPY: { label: 'Japanese Yen', symbol: '¥' },
    AUD: { label: 'Australian Dollar', symbol: 'A$' },
    CAD: { label: 'Canadian Dollar', symbol: 'C$' },
    BRL: { label: 'Brazilian Real', symbol: 'R$' },
    CHF: { label: 'Swiss Franc', symbol: 'CHF' },
    // add more as needed
}

// Add offline currencies with their USD rates
const offlineRates = {
    NGN: 1500, // 1 USD = 1500 NGN
    // add more offline currencies if needed
}

// Simple function to generate a random pastel color
function getRandomColor(code) {
    let hash = 0
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = hash % 360
    return `hsl(${h}, 70%, 60%)`
}

export const useFxStore = defineStore('fx', () => {
    const fx = ref({})
    const feeRate = ref(0.02)
    const loading = ref(false)
    const error = ref(null)

    // computed list of FX with metadata
    const fxList = computed(() => {
        const list = Object.entries(fx.value).map(([code, rate]) => {
            const meta = currencyMeta[code] || { label: code, symbol: code }
            return {
                label: meta.label,
                value: code,
                symbol: meta.symbol,
                color: getRandomColor(code),
                rate
            }
        })

        // Include USD explicitly
        if (!list.find(c => c.value === 'USD')) {
            list.unshift({
                label: currencyMeta.USD.label,
                value: 'USD',
                symbol: currencyMeta.USD.symbol,
                color: getRandomColor('USD'),
                rate: 1
            })
        }

        // Include NGN if not present
        if (!list.find(c => c.value === 'NGN')) {
            list.push({
                label: currencyMeta.NGN.label,
                value: 'NGN',
                symbol: currencyMeta.NGN.symbol,
                color: getRandomColor('NGN'),
                rate: 1500
            })
        }

        return list
    })

    const fetchFx = async (base = 'USD') => {
        loading.value = true
        error.value = null
        try {
            const res = await api.get(`/fx/rates?base=${base}`)
            if (res.data && res.data.rates) {
                fx.value = res.data.rates
            } else {
                throw new Error('Invalid FX response')
            }
        } catch (err) {
            console.error('Failed to fetch FX rates:', err)
            error.value = err.response?.data?.message || err.message || 'Failed to load FX rates'
        } finally {
            loading.value = false
        }
    }

    const getRate = (code) => {
        return fx.value[code] ?? null
    }

const allRates = computed(() => {
    return { ...fx.value, ...offlineRates }
})

const getExchangeRate = (from, to) => {
    if (from === to) return 1

    const rates = allRates.value
    const fromRate = from === 'USD' ? 1 : rates[from]
    const toRate   = to   === 'USD' ? 1 : rates[to]

    if (!fromRate || !toRate) return null
    return toRate / fromRate
}




    return {
        loading,
        error,
        fx,
        feeRate,
        fxList,
        fetchFx,
        getRate,
        getExchangeRate
    }
})
