import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

export const useTransactionStore = defineStore('transactions', () => {
    const { simulateDelay } = useHelpers()

    // -----------------------------
    // State
    // -----------------------------
    const transactions = ref([])
    const loading = ref(false)
    const error = ref('')

    // Pagination
    const page = ref(1)
    const limit = ref(8)
    const total = ref(0)
    const hasMore = computed(() => transactions.value.length < total.value)

    // -----------------------------
    // Actions
    // -----------------------------

    /**
     * Fetch paginated transactions
     * @param {boolean} reset
     */
    const fetchTransactions = async (reset = false) => {
        if (loading.value) return
        loading.value = true
        error.value = ''

        if (reset) {
            page.value = 1
            transactions.value = []
        }

        try {
            if (import.meta.env.DEV) await simulateDelay(700)

            // Include pagination parameters in API call
            const response = await api.get('/transactions', {
                params: {
                    limit: limit.value,
                    page: page.value,
                },
            })

            const data = response.data
            const newTxs = (data.transactions || []).map(tx => ({
                ...tx,
                ref: tx._id?.slice(0, 10) || tx.id?.slice(0, 10),
            }))

            const existingIds = new Set(transactions.value.map(tx => tx._id || tx.id))
            const filteredTxs = newTxs.filter(tx => !existingIds.has(tx._id || tx.id))

            transactions.value.push(...filteredTxs)
            total.value = data.total ?? transactions.value.length
            page.value++
        } catch (err) {
            console.error('Failed to fetch transactions:', err)
            error.value = err.response?.data?.message || err.message || 'Fetch failed'
        } finally {
            loading.value = false
        }
    }


    /**
     * Add or prepend a transaction (optimistic update)
     */
    const addTransaction = (tx) => transactions.value.push(tx)
    const prependTransaction = (tx) => transactions.value.unshift(tx)

    /**
     * Update a transaction by id
     */
    const updateTransaction = (tx) => {
        const id = tx._id || tx.id
        const index = transactions.value.findIndex(t => (t._id || t.id) === id)
        if (index !== -1) transactions.value[index] = tx
    }

    /**
     * Reset the store to initial state
     */
    const resetStore = () => {
        transactions.value = []
        loading.value = false
        error.value = ''
        page.value = 1
        total.value = 0
    }

    return {
        // state
        transactions,
        loading,
        error,
        page,
        limit,
        total,
        hasMore,

        // actions
        fetchTransactions,
        addTransaction,
        prependTransaction,
        updateTransaction,
        resetStore,
    }
})
