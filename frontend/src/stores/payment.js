// stores/payment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const usePaymentStore = defineStore('payment', () => {
    // ------------------------
    // State
    // ------------------------
    const loading = ref(false)
    const error = ref(null)
    const transactions = ref([])

    // ------------------------
    // Actions
    // ------------------------

    // Make a payment / create transaction
    const makePayment = async (paymentData) => {
        loading.value = true
        error.value = null

        try {
            // 1️⃣ Send request to backend
            const res = await api.post('/payments', paymentData)

            // 2️⃣ Return the transaction created by backend
            return res.data.transaction

        } catch (err) {
            console.error('Payment error:', err.response?.data || err)
            error.value = err.response?.data?.message || 'Payment failed'
            throw err
        } finally {
            loading.value = false
        }
    }

    const fetchTransactions = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await api.get('/transactions')
            transactions.value = res.data.transactions
        } catch (err) {
            console.error('Fetch transactions error:', err)
            error.value = err.response?.data?.message || 'Failed to load transactions'
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        transactions,
        makePayment,
        fetchTransactions,
    }
})
