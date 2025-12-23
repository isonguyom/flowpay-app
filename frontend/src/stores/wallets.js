// stores/wallets.js
import { ref, computed } from 'vue'
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
  // Getters
  // ------------------------
  const primaryWallet = computed(() =>
    wallets.value.find((w) => w.isPrimary)
  )

  // ------------------------
  // Actions
  // ------------------------
  const fetchWallets = async () => {
    loading.value = true
    error.value = null

    try {
      await simulateDelay(300)

      const res = await api.get('/wallets')
      wallets.value = res.data.wallets ?? []
    } catch (err) {
      console.error('Fetch wallets error:', err)
      error.value = err.response?.data?.message || 'Failed to load wallets'
    } finally {
      loading.value = false
    }
  }

  const createWallet = async (currency) => {
    loading.value = true
    error.value = null

    try {
      const currencyValue =
        typeof currency === 'object' ? currency.value : currency

      const res = await api.post('/wallets', {
        currency: currencyValue,
      })

      wallets.value.push(res.data.wallet)
      return res.data.wallet
    } catch (err) {
      console.error('Create wallet error:', err)
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
      const res = await api.post('/wallets/fund', {
        walletId,
        amount,
      })

      const updatedWallet = res.data.wallet

      const index = wallets.value.findIndex((w) => w._id === walletId)
      if (index !== -1) {
        wallets.value[index] = updatedWallet
      }

      return updatedWallet
    } catch (err) {
      console.error('Fund wallet error:', err)
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
      const res = await api.post('/wallets/withdraw', {
        walletId,
        amount,
      })

      const updatedWallet = res.data.wallet

      const index = wallets.value.findIndex((w) => w._id === walletId)
      if (index !== -1) {
        wallets.value[index] = updatedWallet
      }

      return updatedWallet
    } catch (err) {
      console.error('Withdraw wallet error:', err)
      error.value =
        err.response?.data?.message || 'Failed to withdraw from wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetWallets = () => {
    wallets.value = []
    error.value = null
  }

  return {
    // state
    wallets,
    loading,
    error,

    // getters
    primaryWallet,

    // actions
    fetchWallets,
    createWallet,
    fundWallet,
    withdrawWallet,
    resetWallets,
  }
})
