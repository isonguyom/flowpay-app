// stores/transactions.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useHelpers } from '@/composables/useHelpers'

export const useTransactionStore = defineStore('transactions', () => {
    const { simulateDelay } = useHelpers()

    // ----------------------------
    // State
    // ----------------------------
    const transactions = ref([])
    const loading = ref(false)
    const error = ref('')

    // Pagination / lazy loading
    const page = ref(1)
    const limit = ref(20)
    const total = ref(0)
    const hasMore = computed(() => transactions.value.length < total.value)

    // ----------------------------
    // Fetch transactions (paginated)
    // ----------------------------
    const fetchTransactions = async (reset = false) => {
        if (loading.value) return
        loading.value = true
        error.value = ''

        if (reset) {
            page.value = 1
            transactions.value = []
        }

        try {
            // Simulate network latency for skeletons
            if (import.meta.env.DEV) await simulateDelay(700)

        const response = await api.get('/transactions')


            const newTxs = response.data.transactions.map(tx => ({
                ...tx,
                ref: tx._id.slice(0, 10),
            }))

            // Append while avoiding duplicates
            const existingIds = new Set(transactions.value.map(tx => tx._id))
            const filteredTxs = newTxs.filter(tx => !existingIds.has(tx._id))

            transactions.value.push(...filteredTxs)
            total.value = response.data.total || transactions.value.length
            page.value++
        } catch (err) {
            console.error('Failed to fetch transactions:', err)
            error.value = err.response?.data?.message || err.message
        } finally {
            loading.value = false
        }
    }

    const updateTransaction = (tx) => {
    const index = transactions.value.findIndex(t => t._id === tx._id)
    if (index !== -1) {
        transactions.value[index] = { ...tx, ref: tx._id.slice(0, 10) }
    }
}


    // ----------------------------
    // Add transaction from WebSocket
    // ----------------------------
    const addTransaction = (tx) => {
        if (!transactions.value.find(t => t._id === tx._id)) {
            transactions.value.unshift({ ...tx, ref: tx._id.slice(0, 10) })
            total.value++
        }
    }

    // ----------------------------
    // Prepend transaction (optimistic update)
    // ----------------------------
    const prependTransaction = (tx) => addTransaction(tx)

    // ----------------------------
    // Reset store
    // ----------------------------
    const resetStore = () => {
        transactions.value = []
        loading.value = false
        error.value = ''
        page.value = 1
        total.value = 0
    }

    return {
        transactions,
        loading,
        error,
        page,
        limit,
        total,
        hasMore,
        fetchTransactions,
        updateTransaction,
        addTransaction,
        prependTransaction,
        resetStore,
    }
})
