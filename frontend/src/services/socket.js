import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transactions'
import { useWalletStore } from '@/stores/wallets'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let socket = null

export function initSocket() {
  if (socket) return socket // singleton guard

  const authStore = useAuthStore()
  const transactionStore = useTransactionStore()
  const walletStore = useWalletStore()

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
  })

  socket.on('connect', () => {
    // console.log('[socket] connected:', socket.id)

    if (authStore.isAuthenticated?.()) {
      const userId = authStore.user?._id
      if (userId) {
        socket.emit('joinRoom', userId)
      }
    }
  })

  socket.on('disconnect', () => {
    // console.log('[socket] disconnected')
  })

  // --------------------
  // Transaction events
  // --------------------
  socket.on('transactionCreated', (transaction) => {
    transactionStore.addTransaction(transaction)
  })

  socket.on('transactionUpdated', (transaction) => {
    transactionStore.updateTransaction(transaction)
  })

  // --------------------
  // Wallet events
  // --------------------
  socket.on('walletCreated', (wallet) => {
    walletStore.addWallet(wallet)
  })

  socket.on('walletUpdated', (wallet) => {
    walletStore.updateWallet(wallet)
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.')
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
