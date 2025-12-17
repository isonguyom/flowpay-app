import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFundingAccountsStore = defineStore('fundingAccounts', () => {
    const accounts = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchFundingAccounts = async () => {
        loading.value = true
        error.value = null
        try {
            // mock for now – replace with API later
            accounts.value = [
                { label: 'Main Bank Account', value: 'bank_main' },
                { label: 'Corporate Card', value: 'card_corp' },
            ]
        } catch (err) {
            error.value = 'Failed to load funding accounts'
        } finally {
            loading.value = false
        }
    }

    return {
        accounts,
        loading,
        error,
        fetchFundingAccounts,
    }
})
