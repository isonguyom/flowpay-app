import { describe, it, beforeEach, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFxStore } from '@/stores/fx'
import api from '@/services/api'

// Mock the API
vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn()
    }
}))

describe('FX Store', () => {
    let store

    const mockFxData = {
        fxList: [
            { value: 'USD', rate: 1 },
            { value: 'EUR', rate: 0.9 },
            { value: 'GBP', rate: 0.8 },
        ],
        base: 'USD',
        fallbackUsed: false
    }

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useFxStore()
        vi.clearAllMocks()
    })

    it('initializes with default state', () => {
        expect(store.fxList).toEqual([])
        expect(store.base).toBe('USD')
        expect(store.fallbackUsed).toBe(false)
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
        expect(store.feeRate).toBe(0.02)
    })

    describe('fetchFx', () => {
        it('fetches FX rates successfully', async () => {
            api.get.mockResolvedValue({ data: mockFxData })
            await store.fetchFx('USD')

            expect(store.loading).toBe(false)
            expect(store.error).toBe(null)
            expect(store.fxList).toEqual(mockFxData.fxList)
            expect(store.base).toBe('USD')
            expect(store.fallbackUsed).toBe(false)
            expect(api.get).toHaveBeenCalledWith('/fx/rates?base=USD')
        })

        it('handles fetch error', async () => {
            api.get.mockRejectedValue({ response: { data: { message: 'API Error' } } })
            await store.fetchFx('USD')

            expect(store.loading).toBe(false)
            expect(store.error).toBe('API Error')
            expect(store.fxList).toEqual([])
        })

        it('returns fallback error message when no response', async () => {
            api.get.mockRejectedValue(new Error('Network error'))
            await store.fetchFx('USD')

            expect(store.error).toBe('Failed to load FX rates')
        })
    })

    describe('helpers', () => {
        beforeEach(() => {
            store.fxList = mockFxData.fxList
        })

        it('getCurrency returns correct currency', () => {
            expect(store.getCurrency('EUR')).toEqual({ value: 'EUR', rate: 0.9 })
            expect(store.getCurrency('JPY')).toBeNull()
        })

        it('getRate returns correct rate', () => {
            expect(store.getRate('GBP')).toBe(0.8)
            expect(store.getRate('JPY')).toBeNull()
        })

        it('getExchangeRate returns correct conversion', () => {
            expect(store.getExchangeRate('USD', 'EUR')).toBeCloseTo(0.9)
            expect(store.getExchangeRate('EUR', 'GBP')).toBeCloseTo(0.8888888)
            expect(store.getExchangeRate('USD', 'USD')).toBe(1)
            expect(store.getExchangeRate('USD', 'JPY')).toBeNull()
        })
    })

    it('computes supportedCurrencies correctly', () => {
        store.fxList = mockFxData.fxList
        expect(store.supportedCurrencies).toEqual(['USD', 'EUR', 'GBP'])
    })
})
