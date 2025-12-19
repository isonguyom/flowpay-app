// stores/payment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { generateIdempotencyKey } from '@/services/idempotency'
import { useHelpers } from '@/composables/useHelpers'

export const usePaymentStore = defineStore('payment', () => {
    const { simulateDelay } = useHelpers()

    // ----------------------------
    // State
    // ----------------------------
    const loading = ref(false)
    const error = ref('')
    const idempotencyKey = ref(null)
    const flow = ref('old') // default flow, backend can switch it to 'new'

    // ----------------------------
    // Make Payment
    // ----------------------------
    const makePayment = async (paymentData) => {
        if (loading.value) return

        loading.value = true
        error.value = ''

        // Generate a new idempotency key for each payment attempt
        idempotencyKey.value = generateIdempotencyKey()

        try {
            // Optional: simulate network delay in dev mode
            if (import.meta.env.DEV) await simulateDelay(500)

            const response = await api.post('/payments', paymentData, {
                headers: {
                    'Idempotency-Key': idempotencyKey.value,
                },
            })

            // Update feature flow if backend returns it
            flow.value = response.data.flow || 'old'

            return response.data
        } catch (err) {
            console.error('Payment failed:', err)
            error.value = err.response?.data?.message || err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    // ----------------------------
    // Reset store
    // ----------------------------
    const reset = () => {
        loading.value = false
        error.value = ''
        idempotencyKey.value = null // allow new payment attempts
        flow.value = 'old'          // reset flow
    }

    return {
        loading,
        error,
        idempotencyKey,
        flow,
        makePayment,
        reset,
    }
})
