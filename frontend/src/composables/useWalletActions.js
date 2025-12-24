import { ref } from 'vue'

export function useWalletActions({
  walletStore,
  transactionStore,
  toastRef,
}) {
  const submitting = ref(false)
  const selectedWallet = ref(null)

  const resetState = () => {
    selectedWallet.value = null
  }

  const fundWallet = async (walletId, amount) => {
    submitting.value = true
    try {
      await walletStore.fundWallet(walletId, amount)
      await Promise.all([
        walletStore.fetchWallets(),
        transactionStore.fetchTransactions(),
      ])
      toastRef.value?.addToast('Wallet funded successfully', 'success')
      return true
    } catch {
      toastRef.value?.addToast(
        walletStore.error || 'Failed to fund wallet',
        'error'
      )
      return false
    } finally {
      submitting.value = false
      resetState()
    }
  }

  const withdrawWallet = async (walletId, amount, beneficiary) => {
    submitting.value = true
    try {
      await walletStore.withdrawWallet(walletId, amount, { beneficiary })
      await Promise.all([
        walletStore.fetchWallets(),
        transactionStore.fetchTransactions(),
      ])
      toastRef.value?.addToast('Withdrawal successful', 'success')
      return true
    } catch {
      toastRef.value?.addToast(
        walletStore.error || 'Unable to process withdrawal',
        'error'
      )
      return false
    } finally {
      submitting.value = false
      resetState()
    }
  }

  return {
    submitting,
    selectedWallet,
    fundWallet,
    withdrawWallet,
  }
}
