import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaymentStore } from '@/stores/payment'
import api from '@/services/api'


vi.mock('@/services/api', () => ({ default: { post: vi.fn() } }))
vi.mock('@/services/idempotency', () => ({ generateIdempotencyKey: vi.fn(() => 'test-key') }))

describe('Payment Store', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        store = usePaymentStore()
        vi.clearAllMocks()
    })

    it('initializes with default state', () => {
        expect(store.loading).toBe(false)
        expect(store.error).toBe('')
        expect(store.flow).toBe('old')
    })

    describe('makePayment', () => {
        it('successfully makes a payment', async () => {
            const payload = { amount: 100, walletId: 'w1' }
            const responseData = { flow: 'new', status: 'success' }

            api.post.mockResolvedValue({ data: responseData })

            const result = await store.makePayment(payload)

            expect(result).toEqual(responseData)
            expect(store.flow).toBe('new')
            expect(store.loading).toBe(false)
            expect(store.error).toBe('')
            expect(api.post).toHaveBeenCalledWith('/payments', payload, {
                headers: { 'Idempotency-Key': 'test-key' },
            })
        })

        it('handles payment error', async () => {
            const payload = { amount: 100, walletId: 'w1' }
            const errorResponse = { response: { data: { message: 'Payment failed' } } }

            api.post.mockRejectedValue(errorResponse)

            await expect(store.makePayment(payload)).rejects.toBeDefined()
            expect(store.error).toBe('Payment failed')
            expect(store.loading).toBe(false)
        })

        it('prevents multiple payment requests', async () => {
            const payload = { amount: 100, walletId: 'w1' }
            api.post.mockImplementation(() => new Promise(res => setTimeout(() => res({ data: { flow: 'new' } }), 100)))

            // Trigger first payment
            const promise1 = store.makePayment(payload)

            // Trigger second payment immediately
            await expect(store.makePayment(payload)).rejects.toThrow('Payment already in progress')

            await promise1
        })


        it('handles generic error without response', async () => {
            const payload = { amount: 100, walletId: 'w1' }
            const genericError = new Error('Network error')
            api.post.mockRejectedValue(genericError)

            await expect(store.makePayment(payload)).rejects.toBeDefined()
            expect(store.error).toBe('Network error')
            expect(store.loading).toBe(false)
        })
    })
})
