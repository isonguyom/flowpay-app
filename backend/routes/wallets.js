import express from 'express'
import {
    createWallet,
    getWallets,
    fundWallet,
    withdrawFromWallet
} from '../controllers/walletController.js'

import { protect } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { walletRateLimiter, walletThrottle } from '../limiters/walletRateLimit.js' // Create these if needed

const router = express.Router()

// --------------------
// Wallet routes
// --------------------

// Get all wallets for authenticated user
router.get('/', protect, getWallets)

// Create a wallet (idempotent to prevent duplicates)
router.post(
    '/',
    protect,
    idempotencyMiddleware,
    walletRateLimiter,
    walletThrottle,
    createWallet
)

// Fund wallet
router.post(
    '/fund',
    protect,
    idempotencyMiddleware,
    walletRateLimiter,
    walletThrottle,
    fundWallet
)

// Withdraw from wallet
router.post(
    '/withdraw',
    protect,
    idempotencyMiddleware,
    walletRateLimiter,
    walletThrottle,
    withdrawFromWallet
)

export default router
