import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

import TransactionsList from '@/components/TransactionsList.vue'
import { useTransactionStore } from '@/stores/transactions'
import { getSocket } from '@/services/socket'

// --------------------
// Mocks
// --------------------
vi.mock('@/stores/transactions')
vi.mock('@/services/socket')

vi.mock('@/components/ui/ApiSkeleton.vue', () => ({
    default: {
        template: '<div data-test="skeleton"><slot /></div>',
    },
}))

vi.mock('@/components/ui/TransactionsGrid.vue', () => ({
    default: {
        props: ['transactions'],
        template: `
      <div data-test="grid">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          data-test="tx"
        />
      </div>
    `,
    },
}))

// --------------------
// Shared test data
// --------------------
const mockTransactions = [
    { id: 'tx1', amount: 100 },
    { id: 'tx2', amount: 200 },
    { id: 'tx3', amount: 300 },
]

// --------------------
// Socket mock (stable)
// --------------------
let socketMock

beforeEach(() => {
    setActivePinia(createPinia())

    socketMock = {
        on: vi.fn(),
        off: vi.fn(),
    }

    getSocket.mockReturnValue(socketMock)

    useTransactionStore.mockReturnValue({
        transactions: [],
        total: 0,
        loading: false,
        error: '',
        hasMore: false,
        fetchTransactions: vi.fn(),
        prependTransaction: vi.fn(),
        updateTransaction: vi.fn(),
    })

    vi.clearAllMocks()
})

describe('TransactionsList', () => {
    it('renders skeleton when loading and empty', () => {
        useTransactionStore.mockReturnValueOnce({
            transactions: [],
            total: 0,
            loading: true,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        })

        const wrapper = mount(TransactionsList)
        expect(wrapper.find('[data-test="skeleton"]').exists()).toBe(true)
    })

    it('renders transactions grid with visible transactions', () => {
        useTransactionStore.mockReturnValueOnce({
            transactions: mockTransactions,
            total: 3,
            loading: false,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        })

        const wrapper = mount(TransactionsList)
        expect(wrapper.findAll('[data-test="tx"]').length).toBe(3)
    })

    it('limits transactions when maxItems is provided', () => {
        useTransactionStore.mockReturnValueOnce({
            transactions: mockTransactions,
            total: 3,
            loading: false,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        })

        const wrapper = mount(TransactionsList, {
            props: { maxItems: 2 },
        })

        expect(wrapper.findAll('[data-test="tx"]').length).toBe(2)
    })

    it('prepends transaction on "transactionCreated" socket event', async () => {
        const store = {
            transactions: [],
            total: 0,
            loading: false,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        }

        useTransactionStore.mockReturnValueOnce(store)

        mount(TransactionsList)
        await flushPromises()

        const createdCall = socketMock.on.mock.calls.find(
            call => call[0] === 'transactionCreated'
        )

        expect(createdCall).toBeTruthy()

        const handler = createdCall[1]
        handler({ id: 'new-tx' })

        expect(store.prependTransaction).toHaveBeenCalledWith({ id: 'new-tx' })
    })

    it('updates transaction on "transactionUpdated" socket event', async () => {
        const store = {
            transactions: [],
            total: 0,
            loading: false,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        }

        useTransactionStore.mockReturnValueOnce(store)

        mount(TransactionsList)
        await flushPromises()

        const updatedCall = socketMock.on.mock.calls.find(
            call => call[0] === 'transactionUpdated'
        )

        expect(updatedCall).toBeTruthy()

        const handler = updatedCall[1]
        handler({ id: 'tx-updated' })

        expect(store.updateTransaction).toHaveBeenCalledWith({ id: 'tx-updated' })
    })

    it('calls fetchTransactions on mount if store is empty', async () => {
        const store = {
            transactions: [],
            total: 0,
            loading: false,
            error: '',
            hasMore: false,
            fetchTransactions: vi.fn(),
            prependTransaction: vi.fn(),
            updateTransaction: vi.fn(),
        }

        useTransactionStore.mockReturnValueOnce(store)

        mount(TransactionsList)
        await flushPromises()

        expect(store.fetchTransactions).toHaveBeenCalledOnce()
    })

    it('removes socket listeners on unmount', async () => {
        const wrapper = mount(TransactionsList)
        await flushPromises()

        const createdHandler = socketMock.on.mock.calls.find(
            call => call[0] === 'transactionCreated'
        )?.[1]

        const updatedHandler = socketMock.on.mock.calls.find(
            call => call[0] === 'transactionUpdated'
        )?.[1]

        wrapper.unmount()

        expect(socketMock.off).toHaveBeenCalledWith(
            'transactionCreated',
            createdHandler
        )
        expect(socketMock.off).toHaveBeenCalledWith(
            'transactionUpdated',
            updatedHandler
        )
    })
})
