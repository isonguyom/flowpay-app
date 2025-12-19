import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let socket = null;

export const initSocket = () => {
  const authStore = useAuthStore();

  if (socket) return socket; // prevent multiple initializations

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], // ensure websocket transport
    withCredentials: true,      // match backend CORS config
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id);

    // Join user-specific room if logged in
    if (authStore.isAuthenticated()) {
      socket.emit('joinRoom', authStore.user._id);
      console.log(`Joined room for user: ${authStore.user._id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  // Listen for transaction updates
  socket.on('transactionUpdated', (transaction) => {
    console.log('Transaction update received:', transaction);
    // You can update your transactions store here
    // e.g., transactionsStore.updateTransaction(transaction)
  });

  // Listen for wallet updates
  socket.on('walletUpdated', (wallet) => {
    console.log('Wallet update received:', wallet);
    // e.g., walletsStore.updateWallet(wallet)
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized. Call initSocket() first.');
  return socket;
};
