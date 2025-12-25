import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transactions'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

vi.mock('@/services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('@/composables/useHelpers', () => ({
  useHelpers: () => ({ simulateDelay: vi.fn() }),
}))

describe('Transaction Store with limit', () => {
  let store

  const mockTransactionsPage1 = Array.from({ length: 8 }, (_, i) => ({
    _id: `tx${i + 1}`,
    amount: (i + 1) * 100
  }))

  const mockTransactionsPage2 = Array.from({ length: 3 }, (_, i) => ({
    _id: `tx${i + 9}`,
    amount: (i + 9) * 100
  }))

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTransactionStore()
    vi.clearAllMocks()
  })

  it('fetches transactions with limit and sets pagination', async () => {
    // page 1
    api.get.mockResolvedValueOnce({ data: { transactions: mockTransactionsPage1, total: 11 } })
    await store.fetchTransactions(true)

    expect(api.get).toHaveBeenCalledWith('/transactions', { params: { limit: 8, page: 1 } })
    expect(store.transactions.length).toBe(8)
    expect(store.page).toBe(2)
    expect(store.hasMore).toBe(true)
    expect(store.total).toBe(11)

    // page 2
    api.get.mockResolvedValueOnce({ data: { transactions: mockTransactionsPage2, total: 11 } })
    await store.fetchTransactions()

    expect(api.get).toHaveBeenCalledWith('/transactions', { params: { limit: 8, page: 2 } })
    expect(store.transactions.length).toBe(11) // 8 + 3
    expect(store.page).toBe(3)
    expect(store.hasMore).toBe(false)
  })

  it('avoids duplicate transactions across pages', async () => {
    // First page
    api.get.mockResolvedValueOnce({ data: { transactions: mockTransactionsPage1, total: 11 } })
    await store.fetchTransactions(true)

    // Second page contains a duplicate of the first transaction
    const secondPageWithDuplicate = [
      mockTransactionsPage1[0], // duplicate
      ...mockTransactionsPage2
    ]
    api.get.mockResolvedValueOnce({ data: { transactions: secondPageWithDuplicate, total: 11 } })
    await store.fetchTransactions()

    // Total transactions should be 11 (8 from page1 + 3 new from page2)
    expect(store.transactions.length).toBe(11)
    // Ensure the first transaction appears only once
    const ids = store.transactions.map(tx => tx._id)
    const duplicates = ids.filter(id => id === mockTransactionsPage1[0]._id)
    expect(duplicates.length).toBe(1)
  })


  it('handles fetch error gracefully', async () => {
    api.get.mockRejectedValueOnce({ response: { data: { message: 'API Error' } } })
    await store.fetchTransactions()

    expect(store.error).toBe('API Error')
    expect(store.loading).toBe(false)
  })

  describe('transaction helpers', () => {
    beforeEach(() => {
      store.transactions = [...mockTransactionsPage1]
    })

    it('adds a transaction', () => {
      const newTx = { _id: 'tx99', amount: 999 }
      store.addTransaction(newTx)
      expect(store.transactions[0]).toEqual(newTx)
    })

    it('updates a transaction by id', () => {
      const updatedTx = { _id: 'tx1', amount: 555 }
      store.updateTransaction(updatedTx)
      expect(store.transactions[0].amount).toBe(555)
    })
  })

  it('resets the store to initial state', () => {
    store.resetStore()
    expect(store.transactions).toEqual([])
    expect(store.page).toBe(1)
    expect(store.total).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })
})
