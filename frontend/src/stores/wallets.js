// stores/wallet.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useWalletStore = defineStore('wallets', () => {
    // ------------------------
    // State
    // ------------------------
    const wallets = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------
    const fetchWallets = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await api.get('/wallets')
            wallets.value = res.data.wallets || []
        } catch (err) {
            console.error('Fetch wallets error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Failed to load wallets'
        } finally {
            loading.value = false
        }
    }

    const createWallet = async ({ currency, amount = 0 }) => {
        loading.value = true
        error.value = null
        try {
            // if currency is an object, pick its value
            const currencyValue = typeof currency === 'object' ? currency.value : currency
            const res = await api.post('/wallets', { currency: currencyValue, amount })
            wallets.value.push(res.data.wallet)
            return res.data.wallet
        } catch (err) {
            console.error('Create wallet error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Failed to create wallet'
            throw err
        } finally {
            loading.value = false
        }
    }

    const fundWallet = async (walletId, amount) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.patch(`/wallets/${walletId}/fund`, { amount })
            const index = wallets.value.findIndex(w => w._id === walletId)
            if (index !== -1) {
                wallets.value[index].amount = res.data.wallet.amount
            }
            return res.data.wallet
        } catch (err) {
            console.error('Fund wallet error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Failed to fund wallet'
            throw err
        } finally {
            loading.value = false
        }
    }

    const withdrawWallet = async (walletId, amount) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.patch(`/wallets/${walletId}/withdraw`, { amount })
            const index = wallets.value.findIndex(w => w._id === walletId)
            if (index !== -1) {
                wallets.value[index].amount = res.data.wallet.amount
            }
            return res.data.wallet
        } catch (err) {
            console.error('Withdraw wallet error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Failed to withdraw wallet'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        wallets,
        loading,
        error,
        fetchWallets,
        createWallet,
        fundWallet,
        withdrawWallet,
    }
})
