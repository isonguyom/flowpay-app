import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

export const useWalletStore = defineStore('wallets', () => {
  const { simulateDelay } = useHelpers()

  // -----------------------------
  // State
  // -----------------------------
  const wallets = ref([])
  const loading = ref(false)
  const error = ref(null)

  // -----------------------------
  // Getters
  // -----------------------------
  const primaryWallet = computed(() => wallets.value.find(w => w.isPrimary))

  // -----------------------------
  // Actions
  // -----------------------------

  /**
   * Fetch all wallets
   */
  const fetchWallets = async () => {
    loading.value = true
    error.value = null

    try {
      if (import.meta.env.DEV) await simulateDelay(300)
      const res = await api.get('/wallets')
      wallets.value = res.data.wallets ?? []
      return wallets.value
    } catch (err) {
      console.error('Fetch wallets error:', err)
      error.value = err.response?.data?.message || 'Failed to load wallets'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new wallet
   * @param {string|object} currency
   * @returns {object} created wallet
   */
  const createWallet = async (currency) => {
    loading.value = true
    error.value = null

    try {
      const currencyValue = typeof currency === 'object' ? currency.value : currency
      const res = await api.post('/wallets', { currency: currencyValue })
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

  /**
   * Fund an existing wallet
   */
  const fundWallet = async (walletId, amount) => updateWalletAmount(walletId, amount, '/wallets/fund')

  /**
   * Withdraw from an existing wallet
   */
  const withdrawWallet = async (walletId, amount) => updateWalletAmount(walletId, amount, '/wallets/withdraw')

  /**
   * Helper to update wallet amount
   */
  const updateWalletAmount = async (walletId, amount, endpoint) => {
    loading.value = true
    error.value = null

    try {
      const res = await api.post(endpoint, { walletId, amount })
      const updatedWallet = res.data.wallet
      updateWallet(updatedWallet)
      return updatedWallet
    } catch (err) {
      console.error(`${endpoint} error:`, err)
      error.value = err.response?.data?.message || `Failed to update wallet via ${endpoint}`
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add or update wallet locally
   */
  const addWallet = (wallet) => wallets.value.push(wallet)

  const updateWallet = (wallet) => {
    const index = wallets.value.findIndex(w => w._id === wallet._id)
    if (index !== -1) wallets.value[index] = wallet
  }

  /**
   * Reset store
   */
  const resetWallets = () => {
    wallets.value = []
    error.value = null
  }

  return {
    wallets,
    loading,
    error,
    primaryWallet,
    fetchWallets,
    createWallet,
    fundWallet,
    withdrawWallet,
    addWallet,
    updateWallet,
    resetWallets,
  }
})
