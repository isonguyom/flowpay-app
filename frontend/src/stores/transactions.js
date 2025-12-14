// stores/transactions.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTransactionStore = defineStore('transactions', () => {
    const transactions = ref([])
    const loading = ref(false)
    const error = ref('')

    // Simulated fetch
    const fetchTransactions = async () => {
        loading.value = true

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        transactions.value = [
            {
                id: 1,
                ref: 'x00075hgksd',
                from: 'USD',
                to: 'NGN',
                beneficiary: 'John Doe',
                date: '2025-12-13',
                amount: 1000,
                settlementAmount: 1500000,
                status: 'Settled',
            },
            {
                id: 2,
                ref: 'x00075hgksd',
                from: 'EUR',
                to: 'USD',
                beneficiary: 'Chioma Oji',
                date: '2025-12-12',
                amount: 500,
                settlementAmount: 545,
                status: 'Pending',
            },
            {
                id: 3,
                ref: 'x00075hgksd',
                from: 'USD',
                to: 'EUR',
                beneficiary: 'New Beneficiary',
                date: '2025-12-11',
                amount: 250,
                settlementAmount: 230,
                status: 'Pending',
            },
        ]

        loading.value = false
    }

    return {
        transactions,
        loading,
        error,
        fetchTransactions,
    }
})
