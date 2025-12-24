<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { initSocket, getSocket } from '@/services/socket'

import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'
import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'

// -------------------- Props --------------------
const props = defineProps({
  showSkeleton: { type: Boolean, default: true },
  maxItems: { type: Number, default: null }, // Limit number of transactions (for dashboard)
})

// -------------------- Store --------------------
const transactionStore = useTransactionStore()

// -------------------- Socket --------------------
let socket = null
let socketInitialized = false

const handleTransactionCreated = (tx) => {
  if (!tx?.id) return
  transactionStore.prependTransaction(tx)
}

const handleTransactionUpdated = (tx) => {
  if (!tx?.id) return
  transactionStore.updateTransaction(tx)
}

// -------------------- Infinite scroll --------------------
const loadingMore = ref(false)
const allLoaded = computed(() => {
  if (props.maxItems) return false
  return !transactionStore.hasMore
})

// Compute visible transactions based on maxItems
const visibleTransactions = computed(() =>
  props.maxItems
    ? transactionStore.transactions.slice(0, props.maxItems)
    : transactionStore.transactions
)

// Fetch next page
const fetchMore = async () => {
  if (props.maxItems || loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  try {
    await transactionStore.fetchTransactions()
  } catch (err) {
    console.error('Failed to load more transactions:', err)
  } finally {
    loadingMore.value = false
  }
}

// -------------------- Scroll handler --------------------
const handleScroll = () => {
  if (props.maxItems) return
  const scrollPosition = window.innerHeight + window.scrollY
  const bottomPosition = document.documentElement.scrollHeight - 100
  if (scrollPosition >= bottomPosition) fetchMore()
}

// -------------------- Lifecycle --------------------
onMounted(async () => {
  try {
    if (!transactionStore.transactions.length) {
      await transactionStore.fetchTransactions()
    }

    try {
      socket = getSocket()
    } catch {
      socket = initSocket()
    }

    if (socket && !socketInitialized) {
      socket.on('transactionCreated', handleTransactionCreated)
      socket.on('transactionUpdated', handleTransactionUpdated)
      socketInitialized = true
    }

    window.addEventListener('scroll', handleScroll)
  } catch (err) {
    console.error('TransactionsList initialization failed', err)
  }
})

onBeforeUnmount(() => {
  if (socket && socketInitialized) {
    socket.off('transactionCreated', handleTransactionCreated)
    socket.off('transactionUpdated', handleTransactionUpdated)
    socketInitialized = false
  }
  window.removeEventListener('scroll', handleScroll)
})

// -------------------- Expose --------------------
defineExpose({
  transactions: visibleTransactions,
  total: computed(() => transactionStore.total),
  loading: computed(() => transactionStore.loading),
  error: computed(() => transactionStore.error),
  loadingMore,
  allLoaded,
})
</script>

<template>
  <!-- Skeleton only for initial load -->
  <ApiSkeleton v-if="props.showSkeleton && transactionStore.loading && !transactionStore.transactions.length"
    :loading="transactionStore.loading" :error="transactionStore.error" :items="visibleTransactions"
    empty="No transactions available">
    <template #default="{ items }">
      <TransactionsGrid :transactions="items" />
    </template>
  </ApiSkeleton>

  <!-- Transactions Grid -->
  <TransactionsGrid v-else :transactions="visibleTransactions" />

  <!-- Sticky bottom loader (only for full-page infinite scroll) -->
  <div v-if="loadingMore" class="fixed bottom-4 left-0 w-full text-center">
    <span class="inline-block bg-gray-800 text-white px-4 py-2 rounded">
      Loading more transactions...
    </span>
  </div>

  <!-- End of list indicator (only for full-page infinite scroll) -->
  <div v-if="allLoaded && transactionStore.transactions.length" class="w-full text-center py-4 text-gray-400">
    All transactions loaded
  </div>
</template>
