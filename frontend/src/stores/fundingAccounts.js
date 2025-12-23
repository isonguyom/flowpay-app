import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFundingAccountsStore = defineStore('fundingAccounts', () => {
    // ------------------------
    // State
    // ------------------------
    const accounts = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ------------------------
    // Actions
    // ------------------------
    const fetchFundingAccounts = async () => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call for now – replace with real API later
            await new Promise((resolve) => setTimeout(resolve, 200)) // simulate delay

            accounts.value = [
                { label: 'Main Bank Account', value: 'bank_main' },
                { label: 'Corporate Card', value: 'card_corp' },
            ]
        } catch (err) {
            console.error('Fetch funding accounts error:', err)
            error.value = 'Failed to load funding accounts'
        } finally {
            loading.value = false
        }
    }

    // ------------------------
    // Expose state and actions
    // ------------------------
    return {
        accounts,
        loading,
        error,
        fetchFundingAccounts,
    }
})
