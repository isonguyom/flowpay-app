// stores/wallets.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

export const useWalletStore = defineStore('wallets', () => {
    const { simulateDelay } = useHelpers()

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

    const createWallet = async ({ currency }) => {
        loading.value = true
        error.value = null
        try {
            const currencyValue = typeof currency === 'object' ? currency.value : currency
            const res = await api.post('/wallets', { currency: currencyValue })
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

    // ------------------------
    // Fund wallet
    // ------------------------
    const fundWallet = async (walletId, amount) => {
        loading.value = true
        error.value = null
        try {
            // send the wallet _id
            const res = await api.post('/wallets/fund', { walletId, amount })

            // simulate webhook: mark transaction as completed after 2s
            setTimeout(async () => {
                try {
                    await api.post('/wallets/webhook', {
                        transactionId: res.data.transaction._id,
                        type: 'FUND',
                        status: 'Completed'
                    })

                    // update local wallet balance
                    const index = wallets.value.findIndex(w => w._id === walletId)
                    if (index !== -1) {
                        wallets.value[index].amount = res.data.wallet.amount
                    }
                } catch (err) {
                    console.error('Webhook simulation failed:', err)
                }
            }, 2000)

            return res.data.wallet
        } catch (err) {
            console.error('Fund wallet error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Failed to fund wallet'
            throw err
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Withdraw wallet
    // ------------------------
    const withdrawWallet = async (walletId, amount) => {
        loading.value = true
        error.value = null
        try {
            // send the wallet _id
            const res = await api.post('/wallets/withdraw', { walletId, amount })

            // simulate webhook: mark transaction as completed after 2s
            setTimeout(async () => {
                try {
                    await api.post('/wallets/webhook', {
                        transactionId: res.data.transaction._id,
                        type: 'WITHDRAW',
                        status: 'Completed'
                    })

                    // update local wallet balance
                    const index = wallets.value.findIndex(w => w._id === walletId)
                    if (index !== -1) {
                        wallets.value[index].amount = res.data.wallet.amount
                    }
                } catch (err) {
                    console.error('Webhook simulation failed:', err)
                }
            }, 2000)

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
