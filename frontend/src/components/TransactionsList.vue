<script setup>
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { initSocket, getSocket } from '@/services/socket'

import ApiSkeleton from '@/components/ui/ApiSkeleton.vue'
import TransactionsGrid from '@/components/ui/TransactionsGrid.vue'

// Props
defineProps({
  showSkeleton: { type: Boolean, default: true }
})

const transactionStore = useTransactionStore()
let socket = null

// -------------------- Handle new transactions from WebSocket --------------------
const handleTransactionCreated = (tx) => {
  transactionStore.addTransaction(tx)
}

const handleTransactionUpdated = (tx) => {
  transactionStore.updateTransaction(tx)
}

// -------------------- Lifecycle --------------------
onMounted(() => {
  transactionStore.fetchTransactions()

  // Initialize socket if not already
  socket = initSocket()

  socket.on('transactionCreated', handleTransactionCreated)
  socket.on('transactionUpdated', handleTransactionUpdated)
})

onBeforeUnmount(() => {
  if (!socket) return
  socket.off('transactionCreated', handleTransactionCreated)
  socket.off('transactionUpdated', handleTransactionUpdated)
})

// -------------------- Expose transactions array to parent --------------------
defineExpose({
  transactions: computed(() => transactionStore.transactions)
})
</script>

<template>
  <!-- Transactions with optional skeleton -->
  <ApiSkeleton v-if="showSkeleton" :loading="transactionStore.loading" :error="transactionStore.error"
    :items="transactionStore.transactions" empty="No transactions available">
    <template #default="{ items }">
      <TransactionsGrid :transactions="items" />
    </template>
  </ApiSkeleton>

  <TransactionsGrid v-else :transactions="transactionStore.transactions" />
</template>
