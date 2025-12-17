// stores/transactions.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useTransactionStore = defineStore('transactions', () => {
    // ----------------------------
    // State
    // ----------------------------
    const transactions = ref([])
    const loading = ref(false)
    const error = ref('')

    // Pagination / lazy loading
    const page = ref(1)
    const limit = ref(20) // number of transactions per page
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
            const response = await api.get('/transactions', {
                params: { page: page.value, limit: limit.value },
            })

            const data = response.data.transactions.map(tx => ({
                ...tx,
                ref: tx._id.slice(0, 10),
            }))

            // Append while avoiding duplicates
            const existingIds = new Set(transactions.value.map(tx => tx._id))
            const newTransactions = data.filter(tx => !existingIds.has(tx._id))

            transactions.value.push(...newTransactions)

            total.value = response.data.total || transactions.value.length
            page.value++
        } catch (err) {
            console.error('Failed to fetch transactions:', err)
            error.value = err.response?.data?.message || err.message
        } finally {
            loading.value = false
        }
    }

    // ----------------------------
    // Add a new transaction
    // ----------------------------
    const makeTransaction = async (txData) => {
        loading.value = true
        error.value = ''

        try {
            const response = await api.post('/transactions', txData)
            const tx = {
                ...response.data.transaction,
                ref: response.data.transaction._id.slice(0, 10),
            }

            // Add new transaction to the top
            transactions.value.unshift(tx)
            total.value++ // update total count
            return tx
        } catch (err) {
            console.error('Failed to create transaction:', err)
            error.value = err.response?.data?.message || err.message
            throw err
        } finally {
            loading.value = false
        }
    }

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
        makeTransaction,
        resetStore,
    }
})
