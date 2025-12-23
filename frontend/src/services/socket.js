import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transactions'
import { useWalletStore } from '@/stores/wallets'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let socket = null

export const initSocket = () => {
  const authStore = useAuthStore()
  const transactionStore = useTransactionStore()
  const walletStore = useWalletStore()

  if (socket) return socket // prevent multiple initializations

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  })

  socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id)

    // Join user room only if user is authenticated
    if (authStore.isAuthenticated()) {
      const userId = authStore.user?._id
      if (userId) {
        socket.emit('joinRoom', userId)
        console.log(`Joined room for user: ${userId}`)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server')
  })

  // -------------------------------
  // Transaction events
  // -------------------------------
  socket.on('transactionCreated', (transaction) => {
    console.log('Transaction created received:', transaction)
    transactionStore.addTransaction(transaction)
  })

  socket.on('transactionUpdated', (transaction) => {
    console.log('Transaction updated received:', transaction)
    transactionStore.updateTransaction(transaction)
  })

  // -------------------------------
  // Wallet events
  // -------------------------------
  socket.on('walletUpdated', (wallet) => {
    console.log('Wallet update received:', wallet)
    walletStore.updateWallet(wallet)
  })

  socket.on('walletCreated', (wallet) => {
    console.log('New wallet created:', wallet)
    walletStore.addWallet(wallet)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized. Call initSocket() first.')
  return socket
}
