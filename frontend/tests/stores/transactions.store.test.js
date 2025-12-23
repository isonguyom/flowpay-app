import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transactions'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('@/composables/useHelpers', () => ({
  useHelpers: () => ({ simulateDelay: vi.fn() }),
}))

describe('Transaction Store', () => {
  let store

  const mockTransactions = [
    { _id: '1a2b3c', amount: 100 },
    { _id: '4d5e6f', amount: 200 },
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTransactionStore()
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    expect(store.transactions).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
    expect(store.page).toBe(1)
    expect(store.total).toBe(0)
    expect(store.hasMore).toBe(false)
  })

  describe('fetchTransactions', () => {
    it('fetches transactions successfully', async () => {
      api.get.mockResolvedValue({ data: { transactions: mockTransactions, total: 2 } })
      await store.fetchTransactions(true)

      expect(store.transactions.length).toBe(2)
      expect(store.transactions[0].ref).toBe('1a2b3c')
      expect(store.total).toBe(2)
      expect(store.page).toBe(2)
      expect(store.loading).toBe(false)
      expect(store.error).toBe('')
    })

    it('avoids duplicates', async () => {
      api.get.mockResolvedValue({ data: { transactions: mockTransactions, total: 2 } })
      await store.fetchTransactions(true)
      await store.fetchTransactions()

      expect(store.transactions.length).toBe(2) // no duplicates
    })

    it('handles fetch error', async () => {
      api.get.mockRejectedValue({ response: { data: { message: 'API Error' } } })
      await store.fetchTransactions()

      expect(store.error).toBe('API Error')
      expect(store.loading).toBe(false)
    })
  })

  describe('transaction helpers', () => {
    beforeEach(() => {
      store.transactions = [...mockTransactions]
    })

    it('adds a transaction', () => {
      const newTx = { _id: '7g8h9i', amount: 300 }
      store.addTransaction(newTx)
      expect(store.transactions[2]).toEqual(newTx)
    })

    it('prepends a transaction', () => {
      const newTx = { _id: '7g8h9i', amount: 300 }
      store.prependTransaction(newTx)
      expect(store.transactions[0]).toEqual(newTx)
    })

    it('updates a transaction', () => {
      const updatedTx = { _id: '1a2b3c', amount: 999 }
      store.updateTransaction(updatedTx)
      expect(store.transactions[0].amount).toBe(999)
    })
  })

  it('resets the store', () => {
    store.resetStore()
    expect(store.transactions).toEqual([])
    expect(store.page).toBe(1)
    expect(store.total).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })
})
