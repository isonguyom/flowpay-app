import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWalletStore } from '@/stores/wallets'
import api from '@/services/api'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/composables/useHelpers', () => ({
    useHelpers: () => ({ simulateDelay: vi.fn() }),
}))

describe('Wallet Store', () => {
    let store
    const mockWallets = [
        { _id: 'w1', currency: 'USD', balance: 100, isPrimary: true },
        { _id: 'w2', currency: 'EUR', balance: 50, isPrimary: false },
    ]

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useWalletStore()
        vi.clearAllMocks()
    })

    it('initializes with default state', () => {
        expect(store.wallets).toEqual([])
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
        expect(store.primaryWallet).toBeUndefined()
    })

    describe('fetchWallets', () => {
        it('fetches wallets successfully', async () => {
            api.get.mockResolvedValue({ data: { wallets: mockWallets } })
            const result = await store.fetchWallets()

            expect(result).toEqual(mockWallets)
            expect(store.wallets.length).toBe(2)
            expect(store.primaryWallet._id).toBe('w1')
            expect(store.loading).toBe(false)
            expect(store.error).toBe(null)
        })

        it('handles fetch error', async () => {
            api.get.mockRejectedValue({ response: { data: { message: 'API Error' } } })
            await expect(store.fetchWallets()).rejects.toBeDefined()
            expect(store.error).toBe('API Error')
            expect(store.loading).toBe(false)
        })
    })

    describe('createWallet', () => {
        it('creates wallet successfully', async () => {
            const newWallet = { _id: 'w3', currency: 'GBP', balance: 0 }
            api.post.mockResolvedValue({ data: { wallet: newWallet } })
            const result = await store.createWallet('GBP')

            expect(result).toEqual(newWallet)
            expect(store.wallets).toContainEqual(newWallet)
        })

        it('handles creation error', async () => {
            api.post.mockRejectedValue({ response: { data: { message: 'Create Error' } } })
            await expect(store.createWallet('JPY')).rejects.toBeDefined()
            expect(store.error).toBe('Create Error')
        })
    })

    describe('fundWallet / withdrawWallet', () => {
        beforeEach(() => {
            store.wallets = [...mockWallets]
        })

        it('funds wallet successfully', async () => {
            const updated = { ...mockWallets[1], balance: 100 }
            api.post.mockResolvedValue({ data: { wallet: updated } })

            const result = await store.fundWallet('w2', 50)
            expect(result.balance).toBe(100)
            expect(store.wallets.find(w => w._id === 'w2').balance).toBe(100)
        })

        it('withdraws wallet successfully', async () => {
            const updated = { ...mockWallets[0], balance: 50 }
            api.post.mockResolvedValue({ data: { wallet: updated } })

            const result = await store.withdrawWallet('w1', 50)
            expect(result.balance).toBe(50)
            expect(store.wallets.find(w => w._id === 'w1').balance).toBe(50)
        })
    })

    it('adds and updates wallet locally', () => {
        const wallet = { _id: 'w4', currency: 'JPY', balance: 0 }
        store.addWallet(wallet)
        expect(store.wallets).toContainEqual(wallet)

        const updated = { ...wallet, balance: 500 }
        store.updateWallet(updated)
        expect(store.wallets.find(w => w._id === 'w4').balance).toBe(500)
    })

    it('resets wallets', () => {
        store.wallets = [...mockWallets]
        store.resetWallets()
        expect(store.wallets).toEqual([])
        expect(store.error).toBe(null)
    })
})
