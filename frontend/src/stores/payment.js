import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { generateIdempotencyKey } from '@/services/idempotency'

export const usePaymentStore = defineStore('payment', () => {
    // -----------------------------
    // State
    // -----------------------------
    const loading = ref(false)
    const error = ref('')
    const flow = ref('old')

    // -----------------------------
    // Actions
    // -----------------------------
    /**
     * Make a payment
     * @param {object} payload
     * @returns {object} response data
     */
    const makePayment = async (payload) => {
        if (loading.value) throw new Error('Payment already in progress')

        loading.value = true
        error.value = ''

        const idempotencyKey = generateIdempotencyKey()

        try {
            const res = await api.post('/payments', payload, {
                headers: { 'Idempotency-Key': idempotencyKey },
            })

            flow.value = res.data.flow || 'old'
            return res.data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Payment failed'
            throw err
        } finally {
            loading.value = false
        }
    }


    return {
        loading,
        error,
        flow,
        makePayment,
    }
})
