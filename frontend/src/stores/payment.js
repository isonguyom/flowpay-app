import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { generateIdempotencyKey } from '@/services/idempotency'

export const usePaymentStore = defineStore('payment', () => {
    const loading = ref(false)
    const error = ref('')
    const flow = ref('old')

    const makePayment = async (payload) => {
        if (loading.value) return

        loading.value = true
        error.value = ''

        const idempotencyKey = generateIdempotencyKey()

        try {
            const res = await api.post('/payments', payload, {
                headers: {
                    'Idempotency-Key': idempotencyKey
                }
            })

            flow.value = res.data.flow || 'old'
            return res.data
        } catch (err) {
            error.value = err.response?.data?.message || err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        flow,
        makePayment
    }
})
