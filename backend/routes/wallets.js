import express from 'express'
import { getWallets, fundWallet, withdrawWallet, createWallet } from '../controllers/walletController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect) // all routes are protected

router.get('/', getWallets)
router.post('/', createWallet)          // create a new wallet
router.patch('/:walletId/fund', fundWallet)      // Fund a specific wallet
router.patch('/:walletId/withdraw', withdrawWallet) // Withdraw from a specific wallet


export default router

