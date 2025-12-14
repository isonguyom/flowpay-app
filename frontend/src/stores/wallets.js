import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallets', () => {
    // ------------------------
    // State
    // ------------------------
    const wallets = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Mock Data
    // ------------------------
    const mockWallets = [
        {
            id: 1,
            currency: 'USD',
            balance: 12500.75,
            status: 'Active',
        },
        {
            id: 2,
            currency: 'EUR',
            balance: 4300.2,
            status: 'Active',
        },
        {
            id: 3,
            currency: 'NGN',
            balance: 985000,
            status: 'Pending',
        },
    ]

    // ------------------------
    // Actions
    // ------------------------
    const fetchWallets = async () => {
        loading.value = true
        error.value = null

        try {
            // simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1200))

            wallets.value = mockWallets
        } catch (err) {
            error.value = 'Failed to load wallets'
        } finally {
            loading.value = false
        }
    }

    return {
        wallets,
        loading,
        error,
        fetchWallets,
    }
})
